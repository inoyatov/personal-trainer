import { describe, it, expect } from 'vitest';
import { nextLearningStep, exerciseTypeForStep, stepIndex } from './learningSteps';

describe('nextLearningStep', () => {
  it('should advance on correct answer', () => {
    expect(nextLearningStep('EXPOSURE', true)).toBe('RECOGNITION');
    expect(nextLearningStep('RECOGNITION', true)).toBe('CONTROLLED_RECALL');
    expect(nextLearningStep('CONTROLLED_RECALL', true)).toBe('FREE_RECALL');
    expect(nextLearningStep('FREE_RECALL', true)).toBe('TRANSFER');
  });

  it('should stay at TRANSFER (max) on correct', () => {
    expect(nextLearningStep('TRANSFER', true)).toBe('TRANSFER');
  });

  it('should fall back on incorrect answer', () => {
    expect(nextLearningStep('TRANSFER', false)).toBe('FREE_RECALL');
    expect(nextLearningStep('FREE_RECALL', false)).toBe('CONTROLLED_RECALL');
    expect(nextLearningStep('CONTROLLED_RECALL', false)).toBe('RECOGNITION');
    expect(nextLearningStep('RECOGNITION', false)).toBe('EXPOSURE');
  });

  it('should stay at EXPOSURE (floor) on incorrect', () => {
    expect(nextLearningStep('EXPOSURE', false)).toBe('EXPOSURE');
  });

  it('should handle unknown step gracefully', () => {
    expect(nextLearningStep('INVALID' as any, true)).toBe('EXPOSURE');
  });
});

describe('exerciseTypeForStep', () => {
  it('should suggest MC for early steps', () => {
    expect(exerciseTypeForStep('EXPOSURE')).toBe('multiple-choice-gap-fill');
    expect(exerciseTypeForStep('RECOGNITION')).toBe('multiple-choice-gap-fill');
  });

  it('should suggest typed for recall steps', () => {
    expect(exerciseTypeForStep('CONTROLLED_RECALL')).toBe('typed-gap-fill');
    expect(exerciseTypeForStep('FREE_RECALL')).toBe('typed-gap-fill');
  });

  it('should suggest dialog for transfer step', () => {
    expect(exerciseTypeForStep('TRANSFER')).toBe('dialog-completion');
  });
});

describe('stepIndex', () => {
  it('should return correct indices', () => {
    expect(stepIndex('EXPOSURE')).toBe(0);
    expect(stepIndex('RECOGNITION')).toBe(1);
    expect(stepIndex('TRANSFER')).toBe(4);
  });
});
