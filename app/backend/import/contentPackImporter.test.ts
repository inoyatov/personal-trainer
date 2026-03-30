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
    expect(result.counts.vocabulary).toBe(5);
    expect(result.counts.sentences).toBe(4);
    expect(result.counts.dialogs).toBe(1);
    expect(result.counts.dialogTurns).toBe(4);
  });

  it('should persist all entities to DB', () => {
    importContentPack(db, samplePack);

    const allCourses = db.select().from(courses).all();
    expect(allCourses).toHaveLength(1);
    expect(allCourses[0].title).toBe('Transport & Reizen');

    const allVocab = db.select().from(vocabularyItems).all();
    expect(allVocab).toHaveLength(5);
    expect(allVocab.find((v) => v.lemma === 'trein')).toBeDefined();

    const allSentences = db.select().from(sentenceItems).all();
    expect(allSentences).toHaveLength(4);

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

  it('should rollback on duplicate ID error', () => {
    // Import once
    importContentPack(db, samplePack);

    // Import same pack again — should fail due to duplicate primary keys
    const result = importContentPack(db, samplePack);
    expect(result.success).toBe(false);

    // Original data should still be intact
    const allCourses = db.select().from(courses).all();
    expect(allCourses).toHaveLength(1);
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
