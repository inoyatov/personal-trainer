import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDatabase } from '../db/testDb';
import { importContentPack } from './contentPackImporter';
import { courses, modules, lessons, classGroups } from '../db/schema/courses';
import { vocabularyItems, sentenceItems, dialogs, dialogTurns } from '../db/schema/content';
import samplePack from '../../content-packs/sample-transport.json';

describe('contentPackImporter', () => {
  let db: TestDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  it('should import a valid content pack', () => {
    const result = importContentPack(db, samplePack);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.counts.courses).toBe(1);
    expect(result.counts.modules).toBe(1);
    expect(result.counts.lessons).toBe(1);
    expect(result.counts.classGroups).toBe(2);
    expect(result.counts.vocabulary).toBe(18);
    expect(result.counts.sentences).toBe(16);
    expect(result.counts.dialogs).toBe(1);
    expect(result.counts.dialogTurns).toBe(4);
  });

  it('should persist all entities to DB', () => {
    importContentPack(db, samplePack);

    const allCourses = db.select().from(courses).all();
    expect(allCourses).toHaveLength(1);
    expect(allCourses[0].title).toBe('Transport & Reizen');

    const allVocab = db.select().from(vocabularyItems).all();
    expect(allVocab).toHaveLength(18);
    expect(allVocab.find((v) => v.lemma === 'trein')).toBeDefined();

    const allSentences = db.select().from(sentenceItems).all();
    expect(allSentences).toHaveLength(16);

    const allTurns = db.select().from(dialogTurns).all();
    expect(allTurns).toHaveLength(4);
  });

  it('should reject invalid data', () => {
    const result = importContentPack(db, { manifest: {} });
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject non-object data', () => {
    const result = importContentPack(db, 'not json');
    expect(result.success).toBe(false);
  });

  it('should reject pack with missing required fields', () => {
    const result = importContentPack(db, {
      manifest: { name: 'Test' },
      courses: [{ id: 'c1' }], // missing title, targetLevel
    });
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should upsert on re-import (no duplicate error)', () => {
    // Import once
    importContentPack(db, samplePack);

    // Import same pack again — should succeed (upsert behavior)
    const result = importContentPack(db, samplePack);
    expect(result.success).toBe(true);

    // Should still have exactly 1 course (not 2)
    const allCourses = db.select().from(courses).all();
    expect(allCourses).toHaveLength(1);
  });

  it('should reject lesson with fewer than 18 vocab items', () => {
    const smallPack = {
      manifest: { name: 'Test' },
      courses: [{ id: 'c1', title: 'Test', targetLevel: 'A2', languageCode: 'nl', version: '1.0' }],
      modules: [{ id: 'm1', courseId: 'c1', title: 'Mod', orderIndex: 0 }],
      lessons: [{ id: 'l1', moduleId: 'm1', title: 'Lesson', orderIndex: 0, estimatedMinutes: 15 }],
      classGroups: [{ id: 'cg1', lessonId: 'l1', type: 'vocabulary', title: 'Vocab', orderIndex: 0 }],
      vocabulary: [
        { id: 'v1', lemma: 'huis', displayText: 'het huis', partOfSpeech: 'noun', translation: 'house', classGroupId: 'cg1' },
        { id: 'v2', lemma: 'straat', displayText: 'de straat', partOfSpeech: 'noun', translation: 'street', classGroupId: 'cg1' },
      ],
      sentences: [{ id: 's1', text: 'Het huis is groot.', translation: 'The house is big.', lessonId: 'l1', classGroupId: 'cg1' }],
    };
    const result = importContentPack(db, smallPack);
    expect(result.success).toBe(true); // pack succeeds but lesson rejected
    expect(result.counts.lessons).toBe(0);
    expect(result.counts.vocabulary).toBe(0);
    expect(result.counts.sentences).toBe(0);
    expect(result.errors.some((e) => e.includes('Rejected'))).toBe(true);
  });

  it('should detect duplicate vocabulary per course', () => {
    // Build a pack with 18 vocab items where 2 share the same lemma
    const vocabItems = [];
    for (let i = 1; i <= 18; i++) {
      vocabItems.push({
        id: `v-dup-${i}`,
        lemma: i === 18 ? 'huis' : `woord${i}`, // item 18 duplicates item 1 if item 1 were 'huis'
        displayText: i === 18 ? 'het huis' : `woord${i}`,
        partOfSpeech: 'noun',
        translation: `word${i}`,
        classGroupId: 'cg-dup',
      });
    }
    vocabItems[0].lemma = 'huis';
    vocabItems[0].displayText = 'het huis';

    const dupPack = {
      manifest: { name: 'DupTest' },
      courses: [{ id: 'c-dup', title: 'Dup', targetLevel: 'A2', languageCode: 'nl', version: '1.0' }],
      modules: [{ id: 'm-dup', courseId: 'c-dup', title: 'Mod', orderIndex: 0 }],
      lessons: [{ id: 'l-dup', moduleId: 'm-dup', title: 'Lesson', orderIndex: 0, estimatedMinutes: 15 }],
      classGroups: [{ id: 'cg-dup', lessonId: 'l-dup', type: 'vocabulary', title: 'Vocab', orderIndex: 0 }],
      vocabulary: vocabItems,
    };
    const result = importContentPack(db, dupPack);
    expect(result.success).toBe(true);
    expect(result.counts.vocabulary).toBe(17); // 18 - 1 duplicate skipped
    expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
  });

  it('should sanitize HTML in strings', () => {
    const packWithHtml = {
      ...samplePack,
      courses: [
        {
          ...samplePack.courses[0],
          id: 'course-html-test',
          title: 'Test <script>alert("xss")</script> Course',
          description: '<b>Bold</b> description',
        },
      ],
      modules: [{ ...samplePack.modules[0], courseId: 'course-html-test' }],
    };

    const result = importContentPack(db, packWithHtml);
    expect(result.success).toBe(true);

    const imported = db.select().from(courses).all();
    const testCourse = imported.find((c) => c.id === 'course-html-test');
    expect(testCourse).toBeDefined();
    expect(testCourse!.title).not.toContain('<script>');
    expect(testCourse!.description).not.toContain('<b>');
  });
});
