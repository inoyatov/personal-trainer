import { levenshteinDistance } from './typoTolerance';
import { normalizeAnswer } from './answerNormalizer';

export type ConjugationErrorType =
  | 'CORRECT'
  | 'TYPO'
  | 'MISSING_T'
  | 'WRONG_PRONOUN_FORM'
  | 'WRONG';

export interface ConjugationCheckResult {
  errorType: ConjugationErrorType;
  accepted: boolean;
}

/**
 * Conjugation-specific typo tolerance.
 * Stricter than general vocabulary for short verb forms.
 *
 * - 1-3 chars: exact match only (e.g., "ben", "is", "ga")
 * - 4-6 chars: distance <= 1
 * - 7+ chars: distance <= 2
 */
function conjugationTypoAllowed(wordLength: number): number {
  if (wordLength <= 3) return 0;
  if (wordLength <= 6) return 1;
  return 2;
}

/**
 * Classify a conjugation answer into one of 5 error types.
 *
 * Detection order:
 * 1. Normalize both → exact match → CORRECT
 * 2. Expected ends in 't', input = expected minus trailing 't' → MISSING_T
 * 3. Input matches another pronoun's form for the same verb → WRONG_PRONOUN_FORM
 * 4. Levenshtein within conjugation tolerance → TYPO (accepted)
 * 5. Otherwise → WRONG
 *
 * @param userInput - what the user typed
 * @param expectedForm - the correct conjugated form
 * @param allFormsMap - map of pronoun→form for the same verb (for WRONG_PRONOUN_FORM detection)
 * @param targetPronoun - the pronoun being tested (to exclude from other-form matching)
 */
export function classifyConjugationError(
  userInput: string,
  expectedForm: string,
  allFormsMap: Record<string, string>,
  targetPronoun: string,
): ConjugationCheckResult {
  const input = normalizeAnswer(userInput);
  const expected = normalizeAnswer(expectedForm);

  // 1. Exact match after normalization
  if (input === expected) {
    return { errorType: 'CORRECT', accepted: true };
  }

  // 2. MISSING_T: expected ends with 't' and input is expected without the 't'
  if (
    expected.endsWith('t') &&
    expected.length > 1 &&
    input === expected.slice(0, -1)
  ) {
    return { errorType: 'MISSING_T', accepted: false };
  }

  // 3. WRONG_PRONOUN_FORM: input exactly matches another pronoun's form
  for (const [pronoun, form] of Object.entries(allFormsMap)) {
    if (pronoun === targetPronoun) continue;
    if (input === normalizeAnswer(form)) {
      return { errorType: 'WRONG_PRONOUN_FORM', accepted: false };
    }
  }

  // 4. TYPO: within Levenshtein tolerance for conjugation
  const distance = levenshteinDistance(input, expected);
  const maxAllowed = conjugationTypoAllowed(expected.length);
  if (distance > 0 && distance <= maxAllowed) {
    return { errorType: 'TYPO', accepted: true };
  }

  // 5. WRONG
  return { errorType: 'WRONG', accepted: false };
}

/**
 * Convenience: is the answer accepted (CORRECT or TYPO)?
 */
export function isConjugationAccepted(errorType: ConjugationErrorType): boolean {
  return errorType === 'CORRECT' || errorType === 'TYPO';
}

/**
 * Generate a supportive feedback message for each error type.
 */
export function conjugationFeedbackMessage(
  errorType: ConjugationErrorType,
  expectedForm: string,
  targetPronoun: string,
): string {
  switch (errorType) {
    case 'CORRECT':
      return 'Correct!';
    case 'TYPO':
      return `Close enough! The exact spelling is: ${expectedForm}`;
    case 'MISSING_T':
      return `Almost! Don't forget the -t ending for ${formatPronoun(targetPronoun)}. The answer is: ${expectedForm}`;
    case 'WRONG_PRONOUN_FORM':
      return `That's the form for a different pronoun. For ${formatPronoun(targetPronoun)}, the answer is: ${expectedForm}`;
    case 'WRONG':
      return `Not quite. The correct form for ${formatPronoun(targetPronoun)} is: ${expectedForm}`;
  }
}

function formatPronoun(key: string): string {
  const labels: Record<string, string> = {
    IK: 'ik', JIJ: 'jij', U: 'u', HIJ: 'hij', ZIJ_SG: 'zij',
    HET: 'het', WIJ: 'wij', JULLIE: 'jullie', ZIJ_PL: 'zij (plural)',
  };
  return labels[key] ?? key.toLowerCase();
}
