/**
 * Select distractors for a multiple-choice exercise.
 *
 * Good distractors should be:
 * - same part of speech as the target
 * - semantically plausible enough to require thinking
 * - not the correct answer
 */

interface VocabCandidate {
  id: string;
  lemma: string;
  partOfSpeech: string;
}

export interface DistractorOptions {
  count: number;
  preferSamePartOfSpeech: boolean;
}

const DEFAULT_OPTIONS: DistractorOptions = {
  count: 3,
  preferSamePartOfSpeech: true,
};

/**
 * Selects distractor words from a vocabulary pool.
 * Prefers words with the same part of speech as the target.
 * Falls back to any word if not enough same-POS candidates exist.
 */
export function selectDistractors(
  targetWord: string,
  targetPartOfSpeech: string,
  pool: VocabCandidate[],
  options: Partial<DistractorOptions> = {},
): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Filter out the target word itself
  const candidates = pool.filter(
    (v) => v.lemma.toLowerCase() !== targetWord.toLowerCase(),
  );

  if (candidates.length === 0) return [];

  // Partition by part of speech match
  const samePOS: VocabCandidate[] = [];
  const otherPOS: VocabCandidate[] = [];

  for (const c of candidates) {
    if (
      opts.preferSamePartOfSpeech &&
      c.partOfSpeech === targetPartOfSpeech
    ) {
      samePOS.push(c);
    } else {
      otherPOS.push(c);
    }
  }

  // Shuffle both pools
  shuffle(samePOS);
  shuffle(otherPOS);

  // Pick from same POS first, then fill with others
  const selected: string[] = [];
  const combined = [...samePOS, ...otherPOS];

  for (const c of combined) {
    if (selected.length >= opts.count) break;
    if (!selected.includes(c.lemma)) {
      selected.push(c.lemma);
    }
  }

  return selected;
}

/** Fisher-Yates shuffle in place */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffles options array and returns both the shuffled array
 * and the index of the correct answer within it.
 */
export function shuffleOptions(
  correctAnswer: string,
  distractors: string[],
): { options: string[]; correctIndex: number } {
  const options = shuffle([correctAnswer, ...distractors]);
  const correctIndex = options.indexOf(correctAnswer);
  return { options, correctIndex };
}
