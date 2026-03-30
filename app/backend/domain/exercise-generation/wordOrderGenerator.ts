export interface WordOrderExerciseData {
  exerciseType: 'word-order';
  sourceEntityType: 'sentence';
  sourceEntityId: string;
  /** The correct sentence */
  correctSentence: string;
  /** Translation hint */
  translation: string;
  /** Shuffled word tokens for the user to reorder */
  shuffledTokens: string[];
  /** The correct token order */
  correctTokens: string[];
}

/**
 * Split a sentence into tokens, keeping punctuation attached to the preceding word.
 * "Ik ga morgen naar school." → ["Ik", "ga", "morgen", "naar", "school."]
 */
export function tokenizeSentence(sentence: string): string[] {
  // Split on whitespace, preserving punctuation attached to words
  return sentence.trim().split(/\s+/).filter((t) => t.length > 0);
}

/**
 * Shuffle an array using Fisher-Yates. Returns a new array.
 */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Check if two arrays are identical (same order).
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

/**
 * Generate a word order exercise from a sentence.
 * Shuffles until the result differs from the original.
 * Returns null if the sentence is too short (< 3 tokens).
 */
export function generateWordOrder(
  sentence: { id: string; text: string; translation: string },
): WordOrderExerciseData | null {
  const tokens = tokenizeSentence(sentence.text);

  if (tokens.length < 3) return null;

  // Shuffle, ensuring result differs from original (max 20 attempts)
  let shuffled = shuffle(tokens);
  let attempts = 0;
  while (arraysEqual(shuffled, tokens) && attempts < 20) {
    shuffled = shuffle(tokens);
    attempts++;
  }

  // If we somehow couldn't shuffle differently (e.g., all identical tokens), skip
  if (arraysEqual(shuffled, tokens)) return null;

  return {
    exerciseType: 'word-order',
    sourceEntityType: 'sentence',
    sourceEntityId: sentence.id,
    correctSentence: sentence.text,
    translation: sentence.translation,
    shuffledTokens: shuffled,
    correctTokens: tokens,
  };
}

/**
 * Generate multiple word order exercises from a list of sentences.
 */
export function generateWordOrderBatch(
  sentences: Array<{ id: string; text: string; translation: string }>,
  maxExercises = 3,
): WordOrderExerciseData[] {
  const exercises: WordOrderExerciseData[] = [];

  for (const sentence of sentences) {
    if (exercises.length >= maxExercises) break;
    const exercise = generateWordOrder(sentence);
    if (exercise) exercises.push(exercise);
  }

  return exercises;
}

/**
 * Evaluate a user's word order answer.
 * Case-insensitive, punctuation-tolerant comparison.
 */
export function evaluateWordOrder(
  userTokens: string[],
  correctTokens: string[],
): { correct: boolean; userSentence: string; correctSentence: string } {
  const normalize = (tokens: string[]) =>
    tokens.map((t) => t.toLowerCase().replace(/[.,!?;:]+$/, '')).join(' ');

  const userNorm = normalize(userTokens);
  const correctNorm = normalize(correctTokens);

  return {
    correct: userNorm === correctNorm,
    userSentence: userTokens.join(' '),
    correctSentence: correctTokens.join(' '),
  };
}
