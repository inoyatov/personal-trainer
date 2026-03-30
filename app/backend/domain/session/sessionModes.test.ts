import { describe, it, expect } from 'vitest';
import { SESSION_MODES, getSessionMode } from './sessionModes';

describe('sessionModes', () => {
  it('should define three modes', () => {
    expect(Object.keys(SESSION_MODES)).toHaveLength(3);
    expect(SESSION_MODES['low-energy']).toBeDefined();
    expect(SESSION_MODES.normal).toBeDefined();
    expect(SESSION_MODES.deep).toBeDefined();
  });

  describe('low-energy mode', () => {
    const mode = SESSION_MODES['low-energy'];

    it('should have few exercises', () => {
      expect(mode.maxExercises).toBeLessThanOrEqual(10);
    });

    it('should have no new items', () => {
      expect(mode.newItemRatio).toBe(0);
    });

    it('should only have MC exercises', () => {
      expect(mode.exerciseTypes).toEqual(['multiple-choice-gap-fill']);
    });

    it('should have hints enabled by default', () => {
      expect(mode.hintsDefault).toBe(true);
    });
  });

  describe('normal mode', () => {
    const mode = SESSION_MODES.normal;

    it('should have moderate exercise count', () => {
      expect(mode.maxExercises).toBeGreaterThan(10);
      expect(mode.maxExercises).toBeLessThanOrEqual(20);
    });

    it('should allow new items', () => {
      expect(mode.newItemRatio).toBeGreaterThan(0);
    });

    it('should include MC, typed, and dialog', () => {
      expect(mode.exerciseTypes).toContain('multiple-choice-gap-fill');
      expect(mode.exerciseTypes).toContain('typed-gap-fill');
      expect(mode.exerciseTypes).toContain('dialog-completion');
    });
  });

  describe('deep mode', () => {
    const mode = SESSION_MODES.deep;

    it('should have many exercises', () => {
      expect(mode.maxExercises).toBeGreaterThanOrEqual(25);
    });

    it('should include all exercise types', () => {
      expect(mode.exerciseTypes.length).toBeGreaterThanOrEqual(4);
    });

    it('should have hints disabled by default', () => {
      expect(mode.hintsDefault).toBe(false);
    });
  });

  describe('getSessionMode', () => {
    it('should return correct mode', () => {
      expect(getSessionMode('deep').id).toBe('deep');
    });

    it('should default to normal for unknown mode', () => {
      expect(getSessionMode('unknown' as any).id).toBe('normal');
    });
  });
});
