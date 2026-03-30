export interface ConjugationTypedExercise {
  exerciseType: 'conjugation-typed';
  sourceEntityType: 'verb';
  sourceEntityId: string;
  renderedPrompt: string;
  correctAnswer: string;
  verbInfinitive: string;
  verbTranslation: string;
  pronoun: string;
  tense: string;
  verbId: string;
  /** All pronoun→form for error classification */
  allForms: Record<string, string>;
}

export interface VerbInput {
  id: string;
  infinitive: string;
  translation: string;
}

const PRONOUN_LABELS: Record<string, string> = {
  IK: 'ik', JIJ: 'jij', U: 'u', HIJ: 'hij', ZIJ_SG: 'zij',
  HET: 'het', WIJ: 'wij', JULLIE: 'jullie', ZIJ_PL: 'zij (pl)',
};

/**
 * Generate a typed conjugation exercise for a specific verb + pronoun.
 *
 * Prompt: "Conjugate 'werken' for 'ik'"
 * Expected: "werk"
 */
export function generateConjugationTyped(
  verb: VerbInput,
  formsMap: Record<string, string>,
  targetPronoun: string,
): ConjugationTypedExercise | null {
  const form = formsMap[targetPronoun];
  if (!form) return null;

  const pronounLabel = PRONOUN_LABELS[targetPronoun] ?? targetPronoun.toLowerCase();

  return {
    exerciseType: 'conjugation-typed',
    sourceEntityType: 'verb',
    sourceEntityId: verb.id,
    renderedPrompt: `Conjugate "${verb.infinitive}" for "${pronounLabel}"`,
    correctAnswer: form,
    verbInfinitive: verb.infinitive,
    verbTranslation: verb.translation,
    pronoun: targetPronoun,
    tense: 'present',
    verbId: verb.id,
    allForms: formsMap,
  };
}

/**
 * Generate a batch of typed conjugation exercises for multiple verbs.
 * Cycles through pronouns to create variety.
 */
export function generateConjugationTypedBatch(
  verbs: VerbInput[],
  formsMaps: Record<string, Record<string, string>>,
  maxExercises = 10,
): ConjugationTypedExercise[] {
  const exercises: ConjugationTypedExercise[] = [];
  const pronouns = Object.keys(PRONOUN_LABELS);

  for (const verb of verbs) {
    if (exercises.length >= maxExercises) break;
    const formsMap = formsMaps[verb.id];
    if (!formsMap) continue;

    // Shuffle pronouns for variety
    const shuffled = [...pronouns].sort(() => Math.random() - 0.5);

    for (const pronoun of shuffled) {
      if (exercises.length >= maxExercises) break;
      const exercise = generateConjugationTyped(verb, formsMap, pronoun);
      if (exercise) {
        exercises.push(exercise);
        break; // one exercise per verb in a batch
      }
    }
  }

  return exercises;
}
