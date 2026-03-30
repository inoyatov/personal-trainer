import { describe, it, expect } from 'vitest';
import { generateDialogExercises, type DialogTurnInput } from './dialogTurnGenerator';

const bakeryDialog: DialogTurnInput[] = [
  {
    id: 'dt-1', dialogId: 'd-1', speaker: 'Bakker',
    text: 'Goedemorgen! Wat mag het zijn?',
    translation: 'Good morning! What can I get you?', orderIndex: 0,
  },
  {
    id: 'dt-2', dialogId: 'd-1', speaker: 'Klant',
    text: 'Goedemorgen. Ik wil graag een brood.',
    translation: 'Good morning. I would like a bread.', orderIndex: 1,
  },
  {
    id: 'dt-3', dialogId: 'd-1', speaker: 'Bakker',
    text: 'Wit of bruin?',
    translation: 'White or brown?', orderIndex: 2,
  },
  {
    id: 'dt-4', dialogId: 'd-1', speaker: 'Klant',
    text: 'Bruin, alstublieft. En een stuk taart.',
    translation: 'Brown, please. And a piece of cake.', orderIndex: 3,
  },
  {
    id: 'dt-5', dialogId: 'd-1', speaker: 'Bakker',
    text: 'Dat is vijf euro vijftig.',
    translation: 'That is five euros fifty.', orderIndex: 4,
  },
];

const vocabPool = [
  'brood', 'kaas', 'melk', 'koekje', 'taart', 'betalen', 'kopen', 'graag',
];

describe('generateDialogExercises', () => {
  it('should generate exercises from dialog turns', () => {
    const exercises = generateDialogExercises(bakeryDialog, vocabPool);
    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.length).toBeLessThanOrEqual(4); // max turns-1
  });

  it('should have correct exercise type', () => {
    const exercises = generateDialogExercises(bakeryDialog, vocabPool);
    for (const ex of exercises) {
      expect(ex.exerciseType).toBe('dialog-completion');
      expect(ex.sourceEntityType).toBe('dialog_turn');
    }
  });

  it('should include context turns with the target blanked', () => {
    const exercises = generateDialogExercises(bakeryDialog, vocabPool, {
      maxExercises: 1,
    });
    if (exercises.length === 0) return; // word selection is random

    const ex = exercises[0];
    expect(ex.contextTurns.length).toBeGreaterThanOrEqual(2);

    const targetTurn = ex.contextTurns.find((t) => t.isTarget);
    expect(targetTurn).toBeDefined();
    expect(targetTurn!.text).toContain('____');

    // Non-target turns should not have blanks
    const nonTargets = ex.contextTurns.filter((t) => !t.isTarget);
    for (const t of nonTargets) {
      expect(t.text).not.toContain('____');
    }
  });

  it('should have a valid correct answer', () => {
    const exercises = generateDialogExercises(bakeryDialog, vocabPool);
    for (const ex of exercises) {
      expect(ex.correctAnswer.length).toBeGreaterThan(0);
      // The full target text should contain the correct answer (case-insensitive)
      expect(
        ex.fullTargetText.toLowerCase(),
      ).toContain(ex.correctAnswer.toLowerCase());
    }
  });

  it('should include MC options when mode is mc', () => {
    const exercises = generateDialogExercises(bakeryDialog, vocabPool, {
      mode: 'mc',
    });
    for (const ex of exercises) {
      expect(ex.mode).toBe('mc');
      expect(ex.options).toBeDefined();
      expect(ex.options!.length).toBeGreaterThanOrEqual(2);
      expect(ex.options).toContain(ex.correctAnswer);
      expect(ex.correctIndex).toBeDefined();
      expect(ex.options![ex.correctIndex!]).toBe(ex.correctAnswer);
    }
  });

  it('should not include MC options when mode is typed', () => {
    const exercises = generateDialogExercises(bakeryDialog, vocabPool, {
      mode: 'typed',
    });
    for (const ex of exercises) {
      expect(ex.mode).toBe('typed');
      expect(ex.options).toBeUndefined();
    }
  });

  it('should respect maxExercises limit', () => {
    const exercises = generateDialogExercises(bakeryDialog, vocabPool, {
      maxExercises: 2,
    });
    expect(exercises.length).toBeLessThanOrEqual(2);
  });

  it('should skip the first turn (context only)', () => {
    const exercises = generateDialogExercises(bakeryDialog, vocabPool);
    for (const ex of exercises) {
      expect(ex.sourceEntityId).not.toBe('dt-1');
    }
  });

  it('should handle empty turns gracefully', () => {
    const exercises = generateDialogExercises([], vocabPool);
    expect(exercises).toHaveLength(0);
  });

  it('should handle single turn gracefully', () => {
    const exercises = generateDialogExercises(
      [bakeryDialog[0]],
      vocabPool,
    );
    expect(exercises).toHaveLength(0);
  });
});
