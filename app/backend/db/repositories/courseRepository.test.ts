import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../testDb';
import { createCourseRepository } from './courseRepository';
import type { CourseRepository } from './courseRepository';

describe('courseRepository', () => {
  let repo: CourseRepository;

  beforeEach(() => {
    const db = createTestDb();
    repo = createCourseRepository(db);
  });

  describe('courses', () => {
    it('should insert and retrieve a course', () => {
      const course = repo.insertCourse({
        id: 'c1',
        title: 'Dutch A2',
        description: 'Naturalization prep',
        targetLevel: 'A2',
        languageCode: 'nl',
        version: '1.0',
      });

      expect(course.id).toBe('c1');
      expect(course.title).toBe('Dutch A2');

      const fetched = repo.getCourseById('c1');
      expect(fetched).toBeDefined();
      expect(fetched!.title).toBe('Dutch A2');
    });

    it('should list all courses', () => {
      repo.insertCourse({
        id: 'c1',
        title: 'Dutch A2',
        targetLevel: 'A2',
      });
      repo.insertCourse({
        id: 'c2',
        title: 'Dutch B1',
        targetLevel: 'B1',
      });

      const all = repo.getAllCourses();
      expect(all).toHaveLength(2);
    });

    it('should update a course', () => {
      repo.insertCourse({
        id: 'c1',
        title: 'Dutch A2',
        targetLevel: 'A2',
      });

      const updated = repo.updateCourse('c1', { title: 'Dutch A2 Updated' });
      expect(updated!.title).toBe('Dutch A2 Updated');
    });

    it('should delete a course', () => {
      repo.insertCourse({
        id: 'c1',
        title: 'Dutch A2',
        targetLevel: 'A2',
      });

      repo.deleteCourse('c1');
      const fetched = repo.getCourseById('c1');
      expect(fetched).toBeUndefined();
    });
  });

  describe('modules', () => {
    beforeEach(() => {
      repo.insertCourse({
        id: 'c1',
        title: 'Dutch A2',
        targetLevel: 'A2',
      });
    });

    it('should insert and retrieve modules by course', () => {
      repo.insertModule({
        id: 'm1',
        courseId: 'c1',
        title: 'Daily Life',
        orderIndex: 0,
      });
      repo.insertModule({
        id: 'm2',
        courseId: 'c1',
        title: 'Health',
        orderIndex: 1,
      });

      const mods = repo.getModulesByCourse('c1');
      expect(mods).toHaveLength(2);
      expect(mods[0].title).toBe('Daily Life');
      expect(mods[1].title).toBe('Health');
    });

    it('should cascade delete modules when course is deleted', () => {
      repo.insertModule({
        id: 'm1',
        courseId: 'c1',
        title: 'Daily Life',
        orderIndex: 0,
      });

      repo.deleteCourse('c1');
      const mod = repo.getModuleById('m1');
      expect(mod).toBeUndefined();
    });
  });

  describe('lessons', () => {
    beforeEach(() => {
      repo.insertCourse({
        id: 'c1',
        title: 'Dutch A2',
        targetLevel: 'A2',
      });
      repo.insertModule({
        id: 'm1',
        courseId: 'c1',
        title: 'Daily Life',
        orderIndex: 0,
      });
    });

    it('should insert and retrieve lessons by module', () => {
      repo.insertLesson({
        id: 'l1',
        moduleId: 'm1',
        title: 'Doctor Appointment',
        orderIndex: 0,
      });

      const lessons = repo.getLessonsByModule('m1');
      expect(lessons).toHaveLength(1);
      expect(lessons[0].title).toBe('Doctor Appointment');
    });
  });

  describe('class groups', () => {
    beforeEach(() => {
      repo.insertCourse({
        id: 'c1',
        title: 'Dutch A2',
        targetLevel: 'A2',
      });
      repo.insertModule({
        id: 'm1',
        courseId: 'c1',
        title: 'Daily Life',
        orderIndex: 0,
      });
      repo.insertLesson({
        id: 'l1',
        moduleId: 'm1',
        title: 'Doctor Appointment',
        orderIndex: 0,
      });
    });

    it('should insert and retrieve class groups by lesson', () => {
      repo.insertClassGroup({
        id: 'cg1',
        lessonId: 'l1',
        type: 'vocabulary',
        title: 'Vocabulary',
        orderIndex: 0,
      });
      repo.insertClassGroup({
        id: 'cg2',
        lessonId: 'l1',
        type: 'grammar',
        title: 'Grammar',
        orderIndex: 1,
      });

      const groups = repo.getClassGroupsByLesson('l1');
      expect(groups).toHaveLength(2);
      expect(groups[0].type).toBe('vocabulary');
      expect(groups[1].type).toBe('grammar');
    });
  });
});
