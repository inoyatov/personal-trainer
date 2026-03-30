import { selectDistractors, shuffleOptions } from './distractorSelector';

interface SentenceInput {
  id: string;
  text: string;
  translation: string;
}

interface VocabInput {
  id: string;
  lemma: string;
  displayText: string;
  partOfSpeech: string;
}

export interface GapFillExercise {
  exerciseType: 'multiple-choice-gap-fill';
  sourceEntityType: 'sentence';
  sourceEntityId: string;
  renderedPrompt: string;
  sentenceTranslation: string;
  targetWord: string;
  correctAnswer: string;
  options: string[];
  correctIndex: number;
  gapPosition: { start: number; end: number };
}

/**
 * Generate a multiple-choice gap-fill exercise from a sentence.
 *
 * Finds a target vocabulary word in the sentence, replaces it with a blank,
 * and provides the correct answer plus distractors as options.
 */
export function generateGapFill(
  sentence: SentenceInput,
  targetVocab: VocabInput,
  vocabPool: VocabInput[],
  distractorCount = 3,
): GapFillExercise | null {
  const word = targetVocab.lemma;
  const text = sentence.text;

  // Find the target word in the sentence (case-insensitive)
  const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
  const match = regex.exec(text);

  if (!match) {
    // Target word not found in sentence — can't generate exercise
    return null;
  }

  const start = match.index;
  const end = start + match[0].length;
  const matchedWord = match[0]; // preserve original casing

  // Build the prompt with a gap
  const renderedPrompt =
    text.substring(0, start) + '____' + text.substring(end);

  // Select distractors
  const distractors = selectDistractors(
    word,
    targetVocab.partOfSpeech,
    vocabPool.map((v) => ({
      id: v.id,
      lemma: v.lemma,
      partOfSpeech: v.partOfSpeech,
    })),
    { count: distractorCount },
  );

  // Shuffle correct answer with distractors
  const { options, correctIndex } = shuffleOptions(
    matchedWord.toLowerCase(),
    distractors.map((d) => d.toLowerCase()),
  );

  return {
    exerciseType: 'multiple-choice-gap-fill',
    sourceEntityType: 'sentence',
    sourceEntityId: sentence.id,
    renderedPrompt,
    sentenceTranslation: sentence.translation,
    targetWord: word,
    correctAnswer: matchedWord.toLowerCase(),
    options,
    correctIndex,
    gapPosition: { start, end },
  };
}

/**
 * Generate multiple gap-fill exercises for a lesson's content.
 */
export function generateGapFillBatch(
  sentences: SentenceInput[],
  vocabulary: VocabInput[],
  maxExercises = 10,
): GapFillExercise[] {
  const exercises: GapFillExercise[] = [];

  for (const sentence of sentences) {
    if (exercises.length >= maxExercises) break;

    // Try each vocab word to see if it appears in this sentence
    for (const vocab of vocabulary) {
      if (exercises.length >= maxExercises) break;

      const exercise = generateGapFill(sentence, vocab, vocabulary);
      if (exercise) {
        exercises.push(exercise);
        break; // one exercise per sentence
      }
    }
  }

  return exercises;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
