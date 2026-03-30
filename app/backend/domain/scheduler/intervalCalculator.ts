import type { MasteryStage } from '../../../shared/types';
import { applyConfidenceToInterval, overconfidencePenalty } from './confidenceModifiers';

/** Interval multipliers in minutes */
const BASE_INTERVALS: Record<MasteryStage, number> = {
  new: 1,           // 1 minute
  seen: 5,          // 5 minutes
  recognized: 30,   // 30 minutes
  recalled: 240,    // 4 hours
  stable: 1440,     // 1 day
  automated: 10080, // 7 days
};

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;
const MAX_EASE = 4.0;

export interface AnswerQuality {
  isCorrect: boolean;
  responseTimeMs: number;
  hintUsed: boolean;
  confidence?: 0 | 1 | 2;
}

export interface IntervalResult {
  /** New interval in minutes */
  intervalMinutes: number;
  /** New due date as ISO string */
  dueAt: string;
  /** Updated ease score */
  easeScore: number;
  /** Whether this was considered "fast" */
  wasFast: boolean;
}

/**
 * Determine if response was "fast" based on exercise complexity.
 * A response under 3 seconds is considered fast.
 */
function isFastResponse(responseTimeMs: number): boolean {
  return responseTimeMs < 3000;
}

/**
 * Calculate the next review interval based on the answer quality
 * and current review state.
 *
 * Four paths from the design doc:
 * 1. correct + fast + no hint → large interval increase, ease up
 * 2. correct + slow → small interval increase
 * 3. correct + hint → minimal interval increase
 * 4. incorrect → reset to near-term, ease down
 */
export function calculateInterval(
  currentStage: MasteryStage,
  currentEase: number,
  answer: AnswerQuality,
): IntervalResult {
  const baseInterval = BASE_INTERVALS[currentStage];
  const fast = isFastResponse(answer.responseTimeMs);

  let intervalMinutes: number;
  let newEase = currentEase;

  if (!answer.isCorrect) {
    // Path 4: Incorrect — reset to near-term review
    intervalMinutes = Math.max(1, baseInterval * 0.25);
    newEase = Math.max(MIN_EASE, currentEase - 0.2);
  } else if (answer.hintUsed) {
    // Path 3: Correct with hint — minimal increase
    intervalMinutes = baseInterval * 0.8;
    // Ease stays the same
  } else if (!fast) {
    // Path 2: Correct but slow — small increase
    intervalMinutes = baseInterval * currentEase * 0.6;
    newEase = Math.min(MAX_EASE, currentEase + 0.05);
  } else {
    // Path 1: Correct + fast + no hint — large increase
    intervalMinutes = baseInterval * currentEase;
    newEase = Math.min(MAX_EASE, currentEase + 0.1);
  }

  // Apply confidence modifier
  const confidence = answer.confidence ?? 1;
  intervalMinutes = applyConfidenceToInterval(intervalMinutes, confidence as 0 | 1 | 2);

  // Apply overconfidence ease penalty
  newEase += overconfidencePenalty(confidence as 0 | 1 | 2, answer.isCorrect);
  newEase = Math.max(MIN_EASE, Math.min(MAX_EASE, newEase));

  // Clamp interval: minimum 1 minute, maximum 90 days
  intervalMinutes = Math.max(1, Math.min(intervalMinutes, 90 * 1440));

  const dueAt = new Date(
    Date.now() + intervalMinutes * 60 * 1000,
  ).toISOString();

  return {
    intervalMinutes: Math.round(intervalMinutes),
    dueAt,
    easeScore: Math.round(newEase * 100) / 100,
    wasFast: fast,
  };
}
