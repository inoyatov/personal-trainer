import type { ExerciseType } from '../../../shared/types';

export type MasteryDimension = 'recognitionMastery' | 'recallMastery' | 'transferMastery';

/**
 * Map each exercise type to the mastery dimension it trains.
 */
export function dimensionForExercise(exerciseType: string): MasteryDimension {
  switch (exerciseType) {
    case 'multiple-choice-gap-fill':
    case 'translation-choice':
      return 'recognitionMastery';

    case 'typed-gap-fill':
    case 'word-order':
    case 'dictation-recall':
    case 'grammar-drill':
      return 'recallMastery';

    case 'dialog-completion':
    case 'guided-writing':
    case 'sentence-transformation':
      return 'transferMastery';

    default:
      return 'recognitionMastery';
  }
}

/**
 * Compute the mastery delta for an answer.
 *
 * - Correct without hint: +0.12
 * - Correct with hint: +0.05
 * - Incorrect: -0.08
 */
export function computeMasteryDelta(
  correct: boolean,
  hintUsed: boolean,
): number {
  if (!correct) return -0.08;
  return hintUsed ? 0.05 : 0.12;
}

/**
 * Apply a mastery delta, clamped to [0, 1].
 */
export function applyMasteryDelta(current: number, delta: number): number {
  return Math.round(Math.min(1, Math.max(0, current + delta)) * 1000) / 1000;
}
