import { describe, it, expect } from 'vitest';
import type {
  MasteryStage,
  ExerciseType,
  Course,
  SessionMode,
} from './index';

describe('shared types', () => {
  it('should allow valid mastery stages', () => {
    const stages: MasteryStage[] = [
      'new',
      'seen',
      'recognized',
      'recalled',
      'stable',
      'automated',
    ];
    expect(stages).toHaveLength(6);
  });

  it('should allow valid exercise types', () => {
    const types: ExerciseType[] = [
      'multiple-choice-gap-fill',
      'typed-gap-fill',
      'dialog-completion',
    ];
    expect(types.length).toBeGreaterThan(0);
  });

  it('should allow valid session modes', () => {
    const modes: SessionMode[] = [
      'learn',
      'practice',
      'review',
      'exam-simulation',
      'writing-lab',
    ];
    expect(modes).toHaveLength(5);
  });

  it('should allow constructing a Course object', () => {
    const course: Course = {
      id: '1',
      title: 'Dutch A2',
      description: 'Naturalization exam prep',
      targetLevel: 'A2',
      languageCode: 'nl',
      version: '1.0',
    };
    expect(course.id).toBe('1');
    expect(course.languageCode).toBe('nl');
  });
});
