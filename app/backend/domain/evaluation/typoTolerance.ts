/**
 * Compute the Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Use single-row optimization
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

export type ToleranceLevel = 'strict' | 'normal' | 'lenient';

/**
 * Maximum allowed Levenshtein distance for a given tolerance level
 * and word length.
 *
 * - strict: exact match only (distance = 0)
 * - normal: 1 typo for words <= 6 chars, 2 for longer words
 * - lenient: 1 typo for words <= 4 chars, 2 for <= 8, 3 for longer
 */
export function maxAllowedDistance(
  wordLength: number,
  tolerance: ToleranceLevel,
): number {
  switch (tolerance) {
    case 'strict':
      return 0;
    case 'normal':
      return wordLength <= 6 ? 1 : 2;
    case 'lenient':
      if (wordLength <= 4) return 1;
      if (wordLength <= 8) return 2;
      return 3;
  }
}

/**
 * Check whether the user's answer is close enough to the correct answer
 * given the tolerance level.
 *
 * Returns an object with:
 * - `accepted`: whether the answer is accepted
 * - `exact`: whether it was an exact match
 * - `distance`: the Levenshtein distance
 */
export function checkWithTypoTolerance(
  userAnswer: string,
  correctAnswer: string,
  tolerance: ToleranceLevel = 'normal',
): { accepted: boolean; exact: boolean; distance: number } {
  const distance = levenshteinDistance(userAnswer, correctAnswer);
  const exact = distance === 0;
  const maxDist = maxAllowedDistance(correctAnswer.length, tolerance);
  const accepted = distance <= maxDist;

  return { accepted, exact, distance };
}
