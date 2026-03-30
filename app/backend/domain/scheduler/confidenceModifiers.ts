/**
 * Confidence levels:
 * 0 = "Guessed" — user had no idea, got lucky or wrong
 * 1 = "Somewhat Sure" — default, normal confidence
 * 2 = "Confident" — user is certain of their answer
 */
export type Confidence = 0 | 1 | 2;

/**
 * Apply confidence-based multiplier to a review interval.
 *
 * - confidence=0 (guess): interval *= 0.7 (review sooner, memory unstable)
 * - confidence=1 (default): no change
 * - confidence=2 (confident): interval *= 1.2 (can wait longer)
 */
export function applyConfidenceToInterval(
  intervalMinutes: number,
  confidence: Confidence,
): number {
  switch (confidence) {
    case 0:
      return Math.round(intervalMinutes * 0.7);
    case 2:
      return Math.round(intervalMinutes * 1.2);
    default:
      return intervalMinutes;
  }
}

/**
 * Compute extra ease penalty for overconfidence:
 * user was confident (2) but answered incorrectly.
 *
 * Returns an additional negative ease delta on top of the normal incorrect penalty.
 */
export function overconfidencePenalty(
  confidence: Confidence,
  isCorrect: boolean,
): number {
  if (confidence === 2 && !isCorrect) {
    return -0.08;
  }
  return 0;
}

/**
 * Check if a correct answer with low confidence should hold stage advancement.
 *
 * When confidence=0 and answer is correct, memory is likely unstable.
 * We should not upgrade the mastery stage even if thresholds are met.
 */
export function shouldHoldStageAdvancement(
  confidence: Confidence,
  isCorrect: boolean,
): boolean {
  return confidence === 0 && isCorrect;
}

/**
 * Generate feedback message based on confidence + correctness combination.
 */
export function confidenceFeedback(
  confidence: Confidence,
  isCorrect: boolean,
): string | null {
  if (confidence === 2 && !isCorrect) {
    return 'You felt confident, but this one needs more practice.';
  }
  if (confidence === 0 && isCorrect) {
    return 'You got it right! Let\'s reinforce this one.';
  }
  return null;
}
