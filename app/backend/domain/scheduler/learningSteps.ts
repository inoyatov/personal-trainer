export type LearningStep =
  | 'EXPOSURE'
  | 'RECOGNITION'
  | 'CONTROLLED_RECALL'
  | 'FREE_RECALL'
  | 'TRANSFER';

const STEP_ORDER: LearningStep[] = [
  'EXPOSURE',
  'RECOGNITION',
  'CONTROLLED_RECALL',
  'FREE_RECALL',
  'TRANSFER',
];

export function stepIndex(step: LearningStep): number {
  return STEP_ORDER.indexOf(step);
}

/**
 * Advance or fall back one learning step based on answer correctness.
 * - Correct: advance one step (capped at TRANSFER)
 * - Incorrect: fall back one step (floor at EXPOSURE)
 */
export function nextLearningStep(
  current: LearningStep,
  correct: boolean,
): LearningStep {
  const idx = STEP_ORDER.indexOf(current);
  if (idx === -1) return 'EXPOSURE';

  if (correct) {
    return STEP_ORDER[Math.min(STEP_ORDER.length - 1, idx + 1)];
  }

  return STEP_ORDER[Math.max(0, idx - 1)];
}

/**
 * Suggest the best exercise type for a given learning step.
 */
export function exerciseTypeForStep(step: LearningStep): string {
  switch (step) {
    case 'EXPOSURE':
      return 'multiple-choice-gap-fill';
    case 'RECOGNITION':
      return 'multiple-choice-gap-fill';
    case 'CONTROLLED_RECALL':
      return 'typed-gap-fill'; // with hints
    case 'FREE_RECALL':
      return 'typed-gap-fill'; // without hints
    case 'TRANSFER':
      return 'dialog-completion';
  }
}
