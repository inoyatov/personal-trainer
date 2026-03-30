/**
 * Adaptation Policy — PRD v4.3 §6, v4.3.1 §8.
 *
 * Adjusts the exercise mix based on in-session performance.
 *
 * Struggling: accuracy < 0.6 over last 10 OR 3 consecutive errors
 *   → +20% MC probability, +15% repetition weight
 *
 * Fast success: responseTime < 1500ms AND correct
 *   → +20% typing tasks, -10% repetition
 *
 * Scope: session-local only (per PRD v4.3.1 §8).
 * Complements (does not replace) frustrationDetector.ts.
 */

export interface AnswerSignal {
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface AdaptationState {
  /** Increase MC probability by this fraction (0 = no change, 0.20 = +20%) */
  mcBoost: number;
  /** Increase typed exercise probability by this fraction */
  typingBoost: number;
}

const STRUGGLING_ACCURACY_THRESHOLD = 0.6;
const STRUGGLING_WINDOW = 10;
const CONSECUTIVE_ERROR_THRESHOLD = 3;
const FAST_RESPONSE_THRESHOLD_MS = 1500;

/**
 * Detect if the learner is struggling based on recent session answers.
 * PRD v4.3 §6: accuracy < 0.6 over last 10 items OR 3 consecutive errors.
 */
export function detectStruggling(recentAnswers: AnswerSignal[]): boolean {
  const window = recentAnswers.slice(-STRUGGLING_WINDOW);
  if (window.length < 3) return false;

  // Check accuracy
  const correctCount = window.filter((a) => a.isCorrect).length;
  const accuracy = correctCount / window.length;
  if (accuracy < STRUGGLING_ACCURACY_THRESHOLD) return true;

  // Check consecutive errors (from the end)
  let consecutive = 0;
  for (let i = window.length - 1; i >= 0; i--) {
    if (!window[i].isCorrect) {
      consecutive++;
      if (consecutive >= CONSECUTIVE_ERROR_THRESHOLD) return true;
    } else {
      break;
    }
  }

  return false;
}

/**
 * Detect if the learner answered quickly and correctly.
 * PRD v4.3 §6: responseTime < 1500ms AND correct.
 */
export function detectFastSuccess(answer: AnswerSignal): boolean {
  return answer.isCorrect && answer.responseTimeMs < FAST_RESPONSE_THRESHOLD_MS;
}

/**
 * Compute the adaptation state from recent session answers.
 * Returns boost factors that the session builder can apply to exercise selection.
 */
export function computeAdaptation(recentAnswers: AnswerSignal[]): AdaptationState {
  const isStruggling = detectStruggling(recentAnswers);

  // Count fast successes in the window
  const window = recentAnswers.slice(-STRUGGLING_WINDOW);
  const fastSuccessRate =
    window.length > 0
      ? window.filter((a) => detectFastSuccess(a)).length / window.length
      : 0;

  if (isStruggling) {
    return { mcBoost: 0.20, typingBoost: -0.20 };
  }

  if (fastSuccessRate > 0.5) {
    return { mcBoost: -0.10, typingBoost: 0.20 };
  }

  return { mcBoost: 0, typingBoost: 0 };
}
