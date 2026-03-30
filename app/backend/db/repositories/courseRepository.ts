import { eq } from 'drizzle-orm';
import { courses, modules, lessons, classGroups } from '../schema';
import type { AppDatabase } from '../index';

export function createCourseRepository(db: AppDatabase) {
  return {
    // Courses
    getAllCourses() {
      return db.select().from(courses).all();
    },

    getCourseById(id: string) {
      return db.select().from(courses).where(eq(courses.id, id)).get();
    },

    insertCourse(data: typeof courses.$inferInsert) {
      return db.insert(courses).values(data).returning().get();
    },

    updateCourse(id: string, data: Partial<typeof courses.$inferInsert>) {
      return db
        .update(courses)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(courses.id, id))
        .returning()
        .get();
    },

    deleteCourse(id: string) {
      return db.delete(courses).where(eq(courses.id, id)).run();
    },

    // Modules
    getModulesByCourse(courseId: string) {
      return db
        .select()
        .from(modules)
        .where(eq(modules.courseId, courseId))
        .orderBy(modules.orderIndex)
        .all();
    },

    getModuleById(id: string) {
      return db.select().from(modules).where(eq(modules.id, id)).get();
    },

    insertModule(data: typeof modules.$inferInsert) {
      return db.insert(modules).values(data).returning().get();
    },

    deleteModule(id: string) {
      return db.delete(modules).where(eq(modules.id, id)).run();
    },

    // Lessons
    getLessonsByModule(moduleId: string) {
      return db
        .select()
        .from(lessons)
        .where(eq(lessons.moduleId, moduleId))
        .orderBy(lessons.orderIndex)
        .all();
    },

    getLessonById(id: string) {
      return db.select().from(lessons).where(eq(lessons.id, id)).get();
    },

    insertLesson(data: typeof lessons.$inferInsert) {
      return db.insert(lessons).values(data).returning().get();
    },

    deleteLesson(id: string) {
      return db.delete(lessons).where(eq(lessons.id, id)).run();
    },

    // Class Groups
    getClassGroupsByLesson(lessonId: string) {
      return db
        .select()
        .from(classGroups)
        .where(eq(classGroups.lessonId, lessonId))
        .orderBy(classGroups.orderIndex)
        .all();
    },

    insertClassGroup(data: typeof classGroups.$inferInsert) {
      return db.insert(classGroups).values(data).returning().get();
    },

    deleteClassGroup(id: string) {
      return db.delete(classGroups).where(eq(classGroups.id, id)).run();
    },
  };
}

export type CourseRepository = ReturnType<typeof createCourseRepository>;
