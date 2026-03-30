import { describe, it, expect } from 'vitest';
import { dimensionForExercise, computeMasteryDelta, applyMasteryDelta } from './masteryDimensions';

describe('dimensionForExercise', () => {
  it('should map MC gap-fill to recognition', () => {
    expect(dimensionForExercise('multiple-choice-gap-fill')).toBe('recognitionMastery');
  });

  it('should map typed gap-fill to recall', () => {
    expect(dimensionForExercise('typed-gap-fill')).toBe('recallMastery');
  });

  it('should map word-order to recall', () => {
    expect(dimensionForExercise('word-order')).toBe('recallMastery');
  });

  it('should map dialog-completion to transfer', () => {
    expect(dimensionForExercise('dialog-completion')).toBe('transferMastery');
  });

  it('should map guided-writing to transfer', () => {
    expect(dimensionForExercise('guided-writing')).toBe('transferMastery');
  });

  it('should default unknown types to recognition', () => {
    expect(dimensionForExercise('unknown-type')).toBe('recognitionMastery');
  });
});

describe('computeMasteryDelta', () => {
  it('should return +0.12 for correct without hint', () => {
    expect(computeMasteryDelta(true, false)).toBe(0.12);
  });

  it('should return +0.05 for correct with hint', () => {
    expect(computeMasteryDelta(true, true)).toBe(0.05);
  });

  it('should return -0.08 for incorrect', () => {
    expect(computeMasteryDelta(false, false)).toBe(-0.08);
  });

  it('should return -0.08 for incorrect even with hint', () => {
    expect(computeMasteryDelta(false, true)).toBe(-0.08);
  });
});

describe('applyMasteryDelta', () => {
  it('should add delta to current value', () => {
    expect(applyMasteryDelta(0.5, 0.12)).toBeCloseTo(0.62, 2);
  });

  it('should clamp at 1.0', () => {
    expect(applyMasteryDelta(0.95, 0.12)).toBe(1);
  });

  it('should clamp at 0.0', () => {
    expect(applyMasteryDelta(0.05, -0.08)).toBe(0);
  });

  it('should handle zero correctly', () => {
    expect(applyMasteryDelta(0, 0.12)).toBeCloseTo(0.12, 2);
  });
});
