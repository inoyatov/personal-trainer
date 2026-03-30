/**
 * Cold Start Policy — PRD v4.3 §7, v4.3.1 §5.
 *
 * Adjusts the type distribution based on how many sessions a user
 * has completed in a given course.
 *
 * Sessions 1–3:  vocab 80%, sentence 20%
 * Sessions 4–10: vocab 60%, sentence 25%, conjugation 15%
 * Session 10+:   full distribution
 *
 * Scope: per user per course.
 * Only completed sessions count (abandoned < 50% are ignored — handled by caller).
 */

import type { TypeDistribution } from './itemPoolBuilder';

export const FULL_DISTRIBUTION: TypeDistribution = {
  vocabulary: 0.40,
  conjugation: 0.25,
  sentence: 0.20,
  dialog: 0.15,
};

const EARLY_DISTRIBUTION: TypeDistribution = {
  vocabulary: 0.80,
  conjugation: 0,
  sentence: 0.20,
  dialog: 0,
};

const MID_DISTRIBUTION: TypeDistribution = {
  vocabulary: 0.60,
  conjugation: 0.15,
  sentence: 0.25,
  dialog: 0,
};

/**
 * Returns the target type distribution based on how many completed
 * sessions the user has in a course.
 */
export function getColdStartDistribution(sessionCount: number): TypeDistribution {
  if (sessionCount < 3) return EARLY_DISTRIBUTION;
  if (sessionCount < 10) return MID_DISTRIBUTION;
  return FULL_DISTRIBUTION;
}
