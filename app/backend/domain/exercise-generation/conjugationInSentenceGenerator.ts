export interface ConjugationInSentenceExercise {
  exerciseType: 'conjugation-in-sentence';
  sourceEntityType: 'sentence';
  sourceEntityId: string;
  renderedPrompt: string;
  sentenceTranslation: string;
  correctAnswer: string;
  verbInfinitive: string;
  pronoun: string;
  tense: string;
  verbId: string;
  /** All pronoun→form for error classification */
  allForms: Record<string, string>;
}

export interface SentenceVerbInput {
  sentenceId: string;
  sentenceText: string;
  sentenceTranslation: string;
  verbId: string;
  verbInfinitive: string;
  surfaceForm: string;
  pronoun: string;
}

/**
 * Generate a conjugation-in-sentence exercise.
 *
 * Replaces the conjugated verb in the sentence with a blank
 * and shows the infinitive as a hint.
 *
 * Prompt: "Ik ____ in Amsterdam. (wonen)"
 * Expected: "woon"
 */
export function generateConjugationInSentence(
  input: SentenceVerbInput,
  formsMap: Record<string, string>,
): ConjugationInSentenceExercise | null {
  const { sentenceText, surfaceForm, verbInfinitive } = input;

  // Find the surface form in the sentence
  const regex = new RegExp(`\\b${escapeRegex(surfaceForm)}\\b`, 'i');
  const match = regex.exec(sentenceText);
  if (!match) return null;

  // Build prompt with blank + infinitive hint
  const blanked =
    sentenceText.substring(0, match.index) +
    '____' +
    sentenceText.substring(match.index + match[0].length);

  const renderedPrompt = `${blanked} (${verbInfinitive})`;

  return {
    exerciseType: 'conjugation-in-sentence',
    sourceEntityType: 'sentence',
    sourceEntityId: input.sentenceId,
    renderedPrompt,
    sentenceTranslation: input.sentenceTranslation,
    correctAnswer: surfaceForm.toLowerCase(),
    verbInfinitive,
    pronoun: input.pronoun,
    tense: 'present',
    verbId: input.verbId,
    allForms: formsMap,
  };
}

/**
 * Generate a batch of conjugation-in-sentence exercises.
 */
export function generateConjugationInSentenceBatch(
  inputs: SentenceVerbInput[],
  formsMaps: Record<string, Record<string, string>>,
  maxExercises = 5,
): ConjugationInSentenceExercise[] {
  const exercises: ConjugationInSentenceExercise[] = [];

  for (const input of inputs) {
    if (exercises.length >= maxExercises) break;
    const formsMap = formsMaps[input.verbId];
    if (!formsMap) continue;

    const exercise = generateConjugationInSentence(input, formsMap);
    if (exercise) exercises.push(exercise);
  }

  return exercises;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
