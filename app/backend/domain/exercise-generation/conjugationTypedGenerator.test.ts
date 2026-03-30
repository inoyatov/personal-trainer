import { describe, it, expect } from 'vitest';
import {
  generateConjugationTyped,
  generateConjugationTypedBatch,
} from './conjugationTypedGenerator';

const werkenForms: Record<string, string> = {
  IK: 'werk', JIJ: 'werkt', U: 'werkt', HIJ: 'werkt',
  ZIJ_SG: 'werkt', HET: 'werkt', WIJ: 'werken', JULLIE: 'werken', ZIJ_PL: 'werken',
};

const verb = { id: 'v-werken', infinitive: 'werken', translation: 'to work' };

describe('generateConjugationTyped', () => {
  it('should generate exercise for ik', () => {
    const ex = generateConjugationTyped(verb, werkenForms, 'IK');
    expect(ex).not.toBeNull();
    expect(ex!.exerciseType).toBe('conjugation-typed');
    expect(ex!.renderedPrompt).toContain('werken');
    expect(ex!.renderedPrompt).toContain('ik');
    expect(ex!.correctAnswer).toBe('werk');
    expect(ex!.pronoun).toBe('IK');
    expect(ex!.verbId).toBe('v-werken');
  });

  it('should generate exercise for hij', () => {
    const ex = generateConjugationTyped(verb, werkenForms, 'HIJ');
    expect(ex!.correctAnswer).toBe('werkt');
    expect(ex!.renderedPrompt).toContain('hij');
  });

  it('should include allForms for error classification', () => {
    const ex = generateConjugationTyped(verb, werkenForms, 'IK');
    expect(ex!.allForms.IK).toBe('werk');
    expect(ex!.allForms.HIJ).toBe('werkt');
  });

  it('should return null for missing pronoun', () => {
    const ex = generateConjugationTyped(verb, { IK: 'werk' }, 'HIJ');
    expect(ex).toBeNull();
  });

  it('should return null for empty forms map', () => {
    const ex = generateConjugationTyped(verb, {}, 'IK');
    expect(ex).toBeNull();
  });
});

describe('generateConjugationTypedBatch', () => {
  const verbs = [
    { id: 'v-werken', infinitive: 'werken', translation: 'to work' },
    { id: 'v-wonen', infinitive: 'wonen', translation: 'to live' },
    { id: 'v-zijn', infinitive: 'zijn', translation: 'to be' },
  ];

  const formsMaps: Record<string, Record<string, string>> = {
    'v-werken': werkenForms,
    'v-wonen': {
      IK: 'woon', JIJ: 'woont', HIJ: 'woont', WIJ: 'wonen',
      U: 'woont', ZIJ_SG: 'woont', HET: 'woont', JULLIE: 'wonen', ZIJ_PL: 'wonen',
    },
    'v-zijn': {
      IK: 'ben', JIJ: 'bent', HIJ: 'is', WIJ: 'zijn',
      U: 'bent', ZIJ_SG: 'is', HET: 'is', JULLIE: 'zijn', ZIJ_PL: 'zijn',
    },
  };

  it('should generate exercises for multiple verbs', () => {
    const exercises = generateConjugationTypedBatch(verbs, formsMaps);
    expect(exercises.length).toBe(3);
    const verbIds = exercises.map((e) => e.verbId);
    expect(verbIds).toContain('v-werken');
    expect(verbIds).toContain('v-wonen');
    expect(verbIds).toContain('v-zijn');
  });

  it('should respect maxExercises', () => {
    const exercises = generateConjugationTypedBatch(verbs, formsMaps, 2);
    expect(exercises.length).toBe(2);
  });

  it('should skip verbs without forms', () => {
    const exercises = generateConjugationTypedBatch(verbs, { 'v-werken': werkenForms }, 10);
    expect(exercises.length).toBe(1);
  });
});
