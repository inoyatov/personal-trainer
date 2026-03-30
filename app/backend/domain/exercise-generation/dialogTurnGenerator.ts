export interface DialogTurnInput {
  id: string;
  dialogId: string;
  speaker: string;
  text: string;
  translation: string;
  orderIndex: number;
}

export interface DialogExercise {
  exerciseType: 'dialog-completion';
  sourceEntityType: 'dialog_turn';
  sourceEntityId: string;
  dialogId: string;
  /** All turns leading up to and including the target, with the target blanked */
  contextTurns: Array<{
    speaker: string;
    text: string;
    isTarget: boolean;
  }>;
  /** The full target turn text (for display after answering) */
  fullTargetText: string;
  targetTranslation: string;
  /** The word that was blanked out */
  correctAnswer: string;
  /** For MC mode */
  options?: string[];
  correctIndex?: number;
  /** The exercise sub-mode */
  mode: 'mc' | 'typed';
}

/**
 * Pick a keyword from a turn's text to blank out.
 * Prefers longer content words, skips short function words.
 */
function pickTargetWord(text: string): { word: string; start: number; end: number } | null {
  const skipWords = new Set([
    'ik', 'je', 'u', 'we', 'ze', 'het', 'de', 'een', 'en', 'of', 'in',
    'op', 'is', 'dat', 'er', 'ja', 'nee', 'met', 'van', 'voor', 'naar',
    'aan', 'om', 'al', 'ook', 'nog', 'maar', 'dan', 'wel', 'niet', 'kan',
    'dit', 'die', 'wat', 'hoe',
  ]);

  // Get all words with their positions
  const wordRegex = /[a-zA-ZÀ-ÿ]+/g;
  const candidates: Array<{ word: string; start: number; end: number }> = [];
  let match;

  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0];
    if (word.length >= 3 && !skipWords.has(word.toLowerCase())) {
      candidates.push({
        word: word,
        start: match.index,
        end: match.index + word.length,
      });
    }
  }

  if (candidates.length === 0) return null;

  // Prefer longer words
  candidates.sort((a, b) => b.word.length - a.word.length);
  // Pick from the top half (longest words)
  const topCandidates = candidates.slice(0, Math.max(1, Math.ceil(candidates.length / 2)));
  return topCandidates[Math.floor(Math.random() * topCandidates.length)];
}

/**
 * Generate dialog completion exercises from a list of dialog turns.
 * Picks specific turns to blank a word from, showing prior turns as context.
 */
export function generateDialogExercises(
  turns: DialogTurnInput[],
  vocabPool: string[],
  options: { maxExercises?: number; mode?: 'mc' | 'typed' | 'mixed' } = {},
): DialogExercise[] {
  const { maxExercises = 5, mode = 'mixed' } = options;
  const exercises: DialogExercise[] = [];

  // Skip the first turn (it's context-only) and generate from turn 2+
  for (let i = 1; i < turns.length && exercises.length < maxExercises; i++) {
    const targetTurn = turns[i];
    const target = pickTargetWord(targetTurn.text);
    if (!target) continue;

    // Build context: all turns up to and including target, with target blanked
    const contextTurns = turns.slice(0, i + 1).map((t, idx) => ({
      speaker: t.speaker,
      text: idx === i
        ? t.text.substring(0, target.start) + '____' + t.text.substring(target.end)
        : t.text,
      isTarget: idx === i,
    }));

    const correctAnswer = target.word.toLowerCase();
    const exerciseMode =
      mode === 'mixed'
        ? exercises.length % 2 === 0 ? 'mc' : 'typed'
        : mode;

    const exercise: DialogExercise = {
      exerciseType: 'dialog-completion',
      sourceEntityType: 'dialog_turn',
      sourceEntityId: targetTurn.id,
      dialogId: targetTurn.dialogId,
      contextTurns,
      fullTargetText: targetTurn.text,
      targetTranslation: targetTurn.translation,
      correctAnswer,
      mode: exerciseMode,
    };

    // Add MC options if needed
    if (exerciseMode === 'mc') {
      const distractors = vocabPool
        .filter((w) => w.toLowerCase() !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const allOptions = [correctAnswer, ...distractors].sort(
        () => Math.random() - 0.5,
      );
      exercise.options = allOptions;
      exercise.correctIndex = allOptions.indexOf(correctAnswer);
    }

    exercises.push(exercise);
  }

  return exercises;
}
