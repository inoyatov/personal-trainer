import { contentPackSchema, type ContentPack } from '../../shared/schemas/contentPack';
import type { AppDatabase } from '../db/index';
import {
  courses, modules, lessons, classGroups,
} from '../db/schema/courses';
import { vocabularyItems, sentenceItems, dialogs, dialogTurns } from '../db/schema/content';
import { grammarPatterns } from '../db/schema/grammar';
import { writingPrompts } from '../db/schema/writing';
import { verbs, verbConjugationSets, verbConjugationForms, lessonVerbs, sentenceVerbs } from '../db/schema/verbs';
import { sql } from 'drizzle-orm';

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

    // Insert in dependency order
    for (const c of pack.courses) {
      db.insert(courses).values(sanitizeRecord(c)).run();
      counts.courses++;
    }

    for (const m of pack.modules) {
      db.insert(modules).values(sanitizeRecord(m)).run();
      counts.modules++;
    }

    for (const l of pack.lessons) {
      db.insert(lessons).values(sanitizeRecord(l)).run();
      counts.lessons++;
    }

    for (const cg of pack.classGroups) {
      db.insert(classGroups).values(sanitizeRecord(cg)).run();
      counts.classGroups++;
    }

    for (const v of pack.vocabulary) {
      db.insert(vocabularyItems).values(sanitizeRecord(v)).run();
      counts.vocabulary++;
    }

    for (const s of pack.sentences) {
      db.insert(sentenceItems).values(sanitizeRecord(s)).run();
      counts.sentences++;
    }

    for (const d of pack.dialogs) {
      db.insert(dialogs).values(sanitizeRecord(d)).run();
      counts.dialogs++;
    }

    for (const dt of pack.dialogTurns) {
      db.insert(dialogTurns).values(sanitizeRecord(dt)).run();
      counts.dialogTurns++;
    }

    for (const gp of pack.grammarPatterns) {
      db.insert(grammarPatterns).values(sanitizeRecord(gp)).run();
      counts.grammarPatterns++;
    }

    for (const wp of pack.writingPrompts) {
      db.insert(writingPrompts).values(sanitizeRecord(wp)).run();
      counts.writingPrompts++;
    }

    // Verb entities (must come after lessons/sentences for FK order)
    for (const v of pack.verbs) {
      db.insert(verbs).values(sanitizeRecord(v)).run();
      counts.verbs++;
    }

    for (const vcs of pack.verbConjugationSets) {
      db.insert(verbConjugationSets).values(sanitizeRecord(vcs)).run();
      counts.verbConjugationSets++;
    }

    for (const vcf of pack.verbConjugationForms) {
      db.insert(verbConjugationForms).values(sanitizeRecord(vcf as any)).run();
      counts.verbConjugationForms++;
    }

    for (const lv of pack.lessonVerbs) {
      db.insert(lessonVerbs).values(sanitizeRecord(lv as any)).run();
      counts.lessonVerbs++;
    }

    for (const sv of pack.sentenceVerbs) {
      db.insert(sentenceVerbs).values(sanitizeRecord(sv as any)).run();
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
