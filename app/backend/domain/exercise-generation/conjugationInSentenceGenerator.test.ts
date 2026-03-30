import { describe, it, expect } from 'vitest';
import {
  generateConjugationInSentence,
  generateConjugationInSentenceBatch,
} from './conjugationInSentenceGenerator';

const wonenForms: Record<string, string> = {
  IK: 'woon', JIJ: 'woont', HIJ: 'woont', WIJ: 'wonen',
  U: 'woont', ZIJ_SG: 'woont', HET: 'woont', JULLIE: 'wonen', ZIJ_PL: 'wonen',
};

describe('generateConjugationInSentence', () => {
  it('should generate exercise from sentence with verb', () => {
    const ex = generateConjugationInSentence(
      {
        sentenceId: 's-1',
        sentenceText: 'Ik woon in Amsterdam.',
        sentenceTranslation: 'I live in Amsterdam.',
        verbId: 'v-wonen',
        verbInfinitive: 'wonen',
        surfaceForm: 'woon',
        pronoun: 'IK',
      },
      wonenForms,
    );

    expect(ex).not.toBeNull();
    expect(ex!.exerciseType).toBe('conjugation-in-sentence');
    expect(ex!.renderedPrompt).toContain('____');
    expect(ex!.renderedPrompt).toContain('(wonen)');
    expect(ex!.renderedPrompt).not.toContain('woon');
    expect(ex!.correctAnswer).toBe('woon');
    expect(ex!.sentenceTranslation).toBe('I live in Amsterdam.');
    expect(ex!.verbId).toBe('v-wonen');
    expect(ex!.allForms.IK).toBe('woon');
  });

  it('should handle verb at start of sentence', () => {
    const ex = generateConjugationInSentence(
      {
        sentenceId: 's-2',
        sentenceText: 'Woont hij in Rotterdam?',
        sentenceTranslation: 'Does he live in Rotterdam?',
        verbId: 'v-wonen',
        verbInfinitive: 'wonen',
        surfaceForm: 'Woont',
        pronoun: 'HIJ',
      },
      wonenForms,
    );

    expect(ex).not.toBeNull();
    expect(ex!.renderedPrompt).toContain('____');
    expect(ex!.correctAnswer).toBe('woont');
  });

  it('should return null when surface form not found', () => {
    const ex = generateConjugationInSentence(
      {
        sentenceId: 's-3',
        sentenceText: 'Ik ga naar school.',
        sentenceTranslation: 'I go to school.',
        verbId: 'v-wonen',
        verbInfinitive: 'wonen',
        surfaceForm: 'woon',
        pronoun: 'IK',
      },
      wonenForms,
    );

    expect(ex).toBeNull();
  });
});

describe('generateConjugationInSentenceBatch', () => {
  const inputs = [
    {
      sentenceId: 's-1',
      sentenceText: 'Ik woon in Amsterdam.',
      sentenceTranslation: 'I live in Amsterdam.',
      verbId: 'v-wonen',
      verbInfinitive: 'wonen',
      surfaceForm: 'woon',
      pronoun: 'IK',
    },
    {
      sentenceId: 's-2',
      sentenceText: 'Hij werkt vandaag.',
      sentenceTranslation: 'He works today.',
      verbId: 'v-werken',
      verbInfinitive: 'werken',
      surfaceForm: 'werkt',
      pronoun: 'HIJ',
    },
  ];

  const formsMaps: Record<string, Record<string, string>> = {
    'v-wonen': wonenForms,
    'v-werken': {
      IK: 'werk', JIJ: 'werkt', HIJ: 'werkt', WIJ: 'werken',
      U: 'werkt', ZIJ_SG: 'werkt', HET: 'werkt', JULLIE: 'werken', ZIJ_PL: 'werken',
    },
  };

  it('should generate multiple exercises', () => {
    const exercises = generateConjugationInSentenceBatch(inputs, formsMaps);
    expect(exercises).toHaveLength(2);
  });

  it('should respect maxExercises', () => {
    const exercises = generateConjugationInSentenceBatch(inputs, formsMaps, 1);
    expect(exercises).toHaveLength(1);
  });

  it('should skip inputs without forms', () => {
    const exercises = generateConjugationInSentenceBatch(inputs, { 'v-wonen': wonenForms });
    expect(exercises).toHaveLength(1);
  });
});
