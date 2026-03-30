import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDatabase } from '../db/testDb';
import { importLesson } from './lessonImporter';
import { courses, modules, lessons, classGroups } from '../db/schema/courses';
import { vocabularyItems, sentenceItems } from '../db/schema/content';
import { verbs, verbConjugationSets, verbConjugationForms, lessonVerbs } from '../db/schema/verbs';
import { eq } from 'drizzle-orm';

function makeLessonPack(overrides: Record<string, unknown> = {}) {
  return {
    lesson: {
      id: 'l1',
      moduleId: 'placeholder',
      title: 'Lesson One',
      orderIndex: 0,
      estimatedMinutes: 15,
    },
    classGroups: [
      { id: 'cg1', lessonId: 'l1', type: 'vocabulary' as const, title: 'Vocab Group', orderIndex: 0 },
    ],
    vocabulary: [],
    sentences: [],
    dialogs: [],
    dialogTurns: [],
    grammarPatterns: [],
    writingPrompts: [],
    verbs: [],
    verbConjugationSets: [],
    verbConjugationForms: [],
    lessonVerbs: [],
    sentenceVerbs: [],
    ...overrides,
  };
}

function seedCourseAndModule(db: TestDatabase) {
  db.insert(courses)
    .values({
      id: 'c1',
      title: 'Test',
      targetLevel: 'A2',
      languageCode: 'nl',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .run();
  db.insert(modules)
    .values({ id: 'm1', courseId: 'c1', title: 'Mod', orderIndex: 0 })
    .run();
}

describe('lessonImporter', () => {
  let db: TestDatabase;

  beforeEach(() => {
    db = createTestDb();
    seedCourseAndModule(db);
  });

  it('should import a lesson into a target module', () => {
    const pack = makeLessonPack({
      vocabulary: [
        { id: 'v1', lemma: 'huis', displayText: 'het huis', partOfSpeech: 'noun', translation: 'house', classGroupId: 'cg1' },
        { id: 'v2', lemma: 'straat', displayText: 'de straat', partOfSpeech: 'noun', translation: 'street', classGroupId: 'cg1' },
      ],
      sentences: [
        { id: 's1', text: 'Het huis is groot.', translation: 'The house is big.', lessonId: 'l1', classGroupId: 'cg1' },
      ],
    });

    const result = importLesson(db, pack, 'm1');

    expect(result.success).toBe(true);
    expect(result.lessonId).toBe('l1');
    expect(result.errors).toHaveLength(0);
    expect(result.counts.classGroups).toBe(1);
    expect(result.counts.vocabulary).toBe(2);
    expect(result.counts.sentences).toBe(1);

    // Verify lesson is stored with the target moduleId
    const allLessons = db.select().from(lessons).where(eq(lessons.id, 'l1')).all();
    expect(allLessons).toHaveLength(1);
    expect(allLessons[0].moduleId).toBe('m1');
    expect(allLessons[0].orderIndex).toBe(0);

    // Verify vocabulary persisted
    const allVocab = db.select().from(vocabularyItems).all();
    expect(allVocab).toHaveLength(2);
  });

  it('should reject invalid data', () => {
    const result = importLesson(db, {}, 'm1');

    expect(result.success).toBe(false);
    expect(result.lessonId).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should sanitize HTML in strings', () => {
    const pack = makeLessonPack({
      lesson: {
        id: 'l-html',
        moduleId: 'placeholder',
        title: 'Vervoer <script>alert("xss")</script> Les',
        orderIndex: 0,
        estimatedMinutes: 15,
      },
      classGroups: [
        { id: 'cg-html', lessonId: 'l-html', type: 'vocabulary' as const, title: 'Groep <b>bold</b>', orderIndex: 0 },
      ],
      vocabulary: [
        { id: 'v-html', lemma: 'trein', displayText: '<em>de trein</em>', partOfSpeech: 'noun', translation: 'train', classGroupId: 'cg-html' },
      ],
    });

    const result = importLesson(db, pack, 'm1');
    expect(result.success).toBe(true);

    const imported = db.select().from(lessons).where(eq(lessons.id, 'l-html')).all();
    expect(imported).toHaveLength(1);
    expect(imported[0].title).not.toContain('<script>');
    expect(imported[0].title).toContain('Vervoer');
    expect(imported[0].title).toContain('Les');

    const importedGroups = db.select().from(classGroups).where(eq(classGroups.id, 'cg-html')).all();
    expect(importedGroups[0].title).not.toContain('<b>');
    expect(importedGroups[0].title).toBe('Groep bold');

    const importedVocab = db.select().from(vocabularyItems).where(eq(vocabularyItems.id, 'v-html')).all();
    expect(importedVocab[0].displayText).not.toContain('<em>');
    expect(importedVocab[0].displayText).toBe('de trein');
  });

  it('should import verb entities', () => {
    const pack = makeLessonPack({
      verbs: [
        { id: 'vb1', infinitive: 'zijn', translation: 'to be', type: 'irregular' },
      ],
      verbConjugationSets: [
        { id: 'vcs1', verbId: 'vb1', tense: 'present', mood: 'indicative' },
      ],
      verbConjugationForms: [
        { id: 'vcf1', conjugationSetId: 'vcs1', pronoun: 'IK', form: 'ben' },
        { id: 'vcf2', conjugationSetId: 'vcs1', pronoun: 'JIJ', form: 'bent' },
        { id: 'vcf3', conjugationSetId: 'vcs1', pronoun: 'HIJ', form: 'is' },
      ],
      lessonVerbs: [
        { lessonId: 'l1', verbId: 'vb1', role: 'target', orderIndex: 0 },
      ],
    });

    const result = importLesson(db, pack, 'm1');
    expect(result.success).toBe(true);
    expect(result.counts.verbs).toBe(1);
    expect(result.counts.verbConjugationSets).toBe(1);
    expect(result.counts.verbConjugationForms).toBe(3);
    expect(result.counts.lessonVerbs).toBe(1);

    // Verify persistence
    const allVerbs = db.select().from(verbs).all();
    expect(allVerbs).toHaveLength(1);
    expect(allVerbs[0].infinitive).toBe('zijn');

    const allSets = db.select().from(verbConjugationSets).all();
    expect(allSets).toHaveLength(1);

    const allForms = db.select().from(verbConjugationForms).all();
    expect(allForms).toHaveLength(3);

    const allLessonVerbs = db.select().from(lessonVerbs).all();
    expect(allLessonVerbs).toHaveLength(1);
  });

  it('should handle empty optional arrays', () => {
    const pack = makeLessonPack();

    const result = importLesson(db, pack, 'm1');

    expect(result.success).toBe(true);
    expect(result.lessonId).toBe('l1');
    expect(result.counts.classGroups).toBe(1);
    expect(result.counts.vocabulary).toBe(0);
    expect(result.counts.sentences).toBe(0);
    expect(result.counts.dialogs).toBe(0);
    expect(result.counts.dialogTurns).toBe(0);
    expect(result.counts.grammarPatterns).toBe(0);
    expect(result.counts.writingPrompts).toBe(0);
    expect(result.counts.verbs).toBe(0);
    expect(result.counts.verbConjugationSets).toBe(0);
    expect(result.counts.verbConjugationForms).toBe(0);
    expect(result.counts.lessonVerbs).toBe(0);
    expect(result.counts.sentenceVerbs).toBe(0);
  });

  it('should assign correct orderIndex for subsequent lesson imports', () => {
    const pack1 = makeLessonPack();
    const pack2 = makeLessonPack({
      lesson: { id: 'l2', moduleId: 'placeholder', title: 'Lesson Two', orderIndex: 0, estimatedMinutes: 15 },
      classGroups: [
        { id: 'cg2', lessonId: 'l2', type: 'vocabulary' as const, title: 'Vocab 2', orderIndex: 0 },
      ],
    });

    importLesson(db, pack1, 'm1');
    const result2 = importLesson(db, pack2, 'm1');

    expect(result2.success).toBe(true);

    const allLessons = db.select().from(lessons).all();
    expect(allLessons).toHaveLength(2);

    const lesson2 = allLessons.find((l) => l.id === 'l2');
    expect(lesson2!.orderIndex).toBe(1);
  });
});
