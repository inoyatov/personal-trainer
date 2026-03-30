import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, type TestDatabase } from '../db/testDb';
import { importContentPack } from '../import/contentPackImporter';
import { exportCourse, exportLesson } from './contentPackExporter';
import samplePack from '../../content-packs/sample-transport.json';

describe('contentPackExporter', () => {
  let db: TestDatabase;

  beforeEach(() => {
    db = createTestDb();
    importContentPack(db, samplePack);
  });

  describe('exportCourse', () => {
    it('should export a full course', () => {
      const pack = exportCourse(db, 'course-transport');

      expect(pack).not.toBeNull();
      expect(pack!.manifest.name).toBe('Transport & Reizen');
      expect(pack!.courses).toHaveLength(1);
      expect(pack!.modules).toHaveLength(1);
      expect(pack!.lessons).toHaveLength(1);
      expect(pack!.classGroups).toHaveLength(2);
      expect(pack!.vocabulary).toHaveLength(18);
      expect(pack!.sentences).toHaveLength(16);
      expect(pack!.dialogs).toHaveLength(1);
      expect(pack!.dialogTurns).toHaveLength(4);
    });

    it('should return null for non-existent course', () => {
      const pack = exportCourse(db, 'nonexistent');
      expect(pack).toBeNull();
    });
  });

  describe('exportLesson', () => {
    it('should export a single lesson with all content', () => {
      const pack = exportLesson(db, 'les-train');

      expect(pack).not.toBeNull();
      expect(pack!.manifest.name).toBe('Met de trein');
      expect(pack!.courses).toHaveLength(1);
      expect(pack!.modules).toHaveLength(1);
      expect(pack!.lessons).toHaveLength(1);
      expect(pack!.vocabulary).toHaveLength(18);
      expect(pack!.sentences).toHaveLength(16);
      expect(pack!.dialogs).toHaveLength(1);
      expect(pack!.dialogTurns).toHaveLength(4);
    });

    it('should return null for non-existent lesson', () => {
      const pack = exportLesson(db, 'nonexistent');
      expect(pack).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('should import an exported pack into a fresh DB', () => {
      const exported = exportCourse(db, 'course-transport');
      expect(exported).not.toBeNull();

      // Import into a fresh DB
      const freshDb = createTestDb();
      const result = importContentPack(freshDb, exported);

      expect(result.success).toBe(true);
      expect(result.counts.courses).toBe(1);
      expect(result.counts.vocabulary).toBe(18);
      expect(result.counts.sentences).toBe(16);
      expect(result.counts.dialogTurns).toBe(4);
    });
  });
});
