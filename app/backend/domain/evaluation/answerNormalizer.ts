/**
 * Normalize an answer string for comparison.
 * - trim whitespace
 * - lowercase
 * - Unicode NFC normalization
 * - collapse multiple spaces
 * - strip trailing punctuation (. , ! ?)
 */
export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]+$/, '')
    .trim();
}

/**
 * Check whether two answers match after normalization.
 */
export function answersMatch(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}
