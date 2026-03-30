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

export function upgradeStage(current: MasteryStage): MasteryStage {
  const idx = stageIndex(current);
  if (idx < STAGE_ORDER.length - 1) {
    return STAGE_ORDER[idx + 1];
  }
  return current;
}

export function downgradeStage(current: MasteryStage): MasteryStage {
  const idx = stageIndex(current);
  // Never go below 'seen' — once you've encountered it, you've seen it
  if (idx > 1) {
    return STAGE_ORDER[idx - 1];
  }
  return 'seen';
}
