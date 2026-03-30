import type { AppDatabase } from '../db/index';
import type { ContentPack } from '../../shared/schemas/contentPack';
import {
  courses, modules, lessons, classGroups,
} from '../db/schema/courses';
import { vocabularyItems, sentenceItems, dialogs, dialogTurns } from '../db/schema/content';
import { grammarPatterns } from '../db/schema/grammar';
import { writingPrompts } from '../db/schema/writing';
import { eq } from 'drizzle-orm';

/**
 * Export an entire course as a content pack.
 */
export function exportCourse(db: AppDatabase, courseId: string): ContentPack | null {
  const course = db.select().from(courses).where(eq(courses.id, courseId)).get();
  if (!course) return null;

  const mods = db.select().from(modules).where(eq(modules.courseId, courseId)).all();
  const moduleIds = mods.map((m) => m.id);

  const allLessons = moduleIds.flatMap((modId) =>
    db.select().from(lessons).where(eq(lessons.moduleId, modId)).all(),
  );
  const lessonIds = allLessons.map((l) => l.id);

  const allClassGroups = lessonIds.flatMap((lesId) =>
    db.select().from(classGroups).where(eq(classGroups.lessonId, lesId)).all(),
  );
  const classGroupIds = allClassGroups.map((cg) => cg.id);

  const allVocabulary = classGroupIds.flatMap((cgId) =>
    db.select().from(vocabularyItems).where(eq(vocabularyItems.classGroupId, cgId)).all(),
  );

  const allSentences = lessonIds.flatMap((lesId) =>
    db.select().from(sentenceItems).where(eq(sentenceItems.lessonId, lesId)).all(),
  );

  const allDialogs = lessonIds.flatMap((lesId) =>
    db.select().from(dialogs).where(eq(dialogs.lessonId, lesId)).all(),
  );
  const dialogIds = allDialogs.map((d) => d.id);

  const allDialogTurns = dialogIds.flatMap((dId) =>
    db.select().from(dialogTurns).where(eq(dialogTurns.dialogId, dId)).all(),
  );

  const allGrammarPatterns = lessonIds.flatMap((lesId) =>
    db.select().from(grammarPatterns).where(eq(grammarPatterns.lessonId, lesId)).all(),
  );

  const allWritingPrompts = lessonIds.flatMap((lesId) =>
    db.select().from(writingPrompts).where(eq(writingPrompts.lessonId, lesId)).all(),
  );

  return {
    manifest: {
      name: course.title,
      version: course.version,
      description: course.description,
      author: '',
      createdAt: new Date().toISOString(),
    },
    courses: [course],
    modules: mods,
    lessons: allLessons,
    classGroups: allClassGroups,
    vocabulary: allVocabulary,
    sentences: allSentences,
    dialogs: allDialogs,
    dialogTurns: allDialogTurns,
    grammarPatterns: allGrammarPatterns,
    writingPrompts: allWritingPrompts,
  };
}

/**
 * Export a single lesson as a content pack.
 */
export function exportLesson(db: AppDatabase, lessonId: string): ContentPack | null {
  const lesson = db.select().from(lessons).where(eq(lessons.id, lessonId)).get();
  if (!lesson) return null;

  const mod = db.select().from(modules).where(eq(modules.id, lesson.moduleId)).get();
  const course = mod
    ? db.select().from(courses).where(eq(courses.id, mod.courseId)).get()
    : null;

  const cgs = db.select().from(classGroups).where(eq(classGroups.lessonId, lessonId)).all();
  const cgIds = cgs.map((cg) => cg.id);

  const vocab = cgIds.flatMap((cgId) =>
    db.select().from(vocabularyItems).where(eq(vocabularyItems.classGroupId, cgId)).all(),
  );

  const sents = db.select().from(sentenceItems).where(eq(sentenceItems.lessonId, lessonId)).all();

  const dlgs = db.select().from(dialogs).where(eq(dialogs.lessonId, lessonId)).all();
  const dts = dlgs.flatMap((d) =>
    db.select().from(dialogTurns).where(eq(dialogTurns.dialogId, d.id)).all(),
  );

  const gps = db.select().from(grammarPatterns).where(eq(grammarPatterns.lessonId, lessonId)).all();
  const wps = db.select().from(writingPrompts).where(eq(writingPrompts.lessonId, lessonId)).all();

  return {
    manifest: {
      name: lesson.title,
      version: '1.0',
      description: lesson.description,
      author: '',
      createdAt: new Date().toISOString(),
    },
    courses: course ? [course] : [],
    modules: mod ? [mod] : [],
    lessons: [lesson],
    classGroups: cgs,
    vocabulary: vocab,
    sentences: sents,
    dialogs: dlgs,
    dialogTurns: dts,
    grammarPatterns: gps,
    writingPrompts: wps,
  };
}
