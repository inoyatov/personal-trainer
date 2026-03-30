export type GapMode = 'MASKED' | 'LENGTH_HINT';

/**
 * Generate the blank placeholder for a gap-fill exercise.
 *
 * - MASKED: always "____" (4 underscores) — doesn't reveal word length
 * - LENGTH_HINT: underscores matching word length, separated by spaces
 *   "dokter" → "_ _ _ _ _ _"
 */
export function generateBlank(targetWord: string, mode: GapMode): string {
  if (mode === 'LENGTH_HINT') {
    return Array.from(targetWord).map(() => '_').join(' ');
  }
  return '____';
}
