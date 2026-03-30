import type { MasteryStage } from '../../../shared/types';

/** Ordered list of mastery stages from lowest to highest */
export const STAGE_ORDER: MasteryStage[] = [
  'new',
  'seen',
  'recognized',
  'recalled',
  'stable',
  'automated',
];

export function stageIndex(stage: MasteryStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/** Simple upgrade (legacy — used as fallback) */
export function upgradeStage(current: MasteryStage): MasteryStage {
  const idx = stageIndex(current);
  if (idx < STAGE_ORDER.length - 1) {
    return STAGE_ORDER[idx + 1];
  }
  return current;
}

/** Simple downgrade (legacy — used as fallback) */
export function downgradeStage(current: MasteryStage): MasteryStage {
  const idx = stageIndex(current);
  if (idx > 1) {
    return STAGE_ORDER[idx - 1];
  }
  return 'seen';
}

/**
 * Determine the correct stage based on mastery dimension thresholds.
 *
 * Stage advancement rules (from PRD v2.1):
 * - NEW → SEEN: after first correct answer (totalCorrect > 0)
 * - SEEN → RECOGNIZED: recognitionMastery >= 0.4
 * - RECOGNIZED → RECALLED: recallMastery >= 0.5
 * - RECALLED → STABLE: recallMastery >= 0.75 AND transferMastery >= 0.4
 * - STABLE → AUTOMATED: all three >= 0.85 AND consecutiveIncorrect <= 1
 *
 * The stage can also go DOWN if mastery drops below thresholds.
 */
export function computeStageFromMastery(input: {
  recognitionMastery: number;
  recallMastery: number;
  transferMastery: number;
  totalCorrect: number;
  consecutiveIncorrect: number;
}): MasteryStage {
  const { recognitionMastery, recallMastery, transferMastery, totalCorrect, consecutiveIncorrect } = input;

  // Check from highest to lowest
  if (
    recognitionMastery >= 0.85 &&
    recallMastery >= 0.85 &&
    transferMastery >= 0.85 &&
    consecutiveIncorrect <= 1
  ) {
    return 'automated';
  }

  if (recallMastery >= 0.75 && transferMastery >= 0.4) {
    return 'stable';
  }

  if (recallMastery >= 0.5) {
    return 'recalled';
  }

  if (recognitionMastery >= 0.4) {
    return 'recognized';
  }

  if (totalCorrect > 0) {
    return 'seen';
  }

  return 'new';
}
