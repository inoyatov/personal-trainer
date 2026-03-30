import { describe, it, expect } from 'vitest';
import {
  tokenizeSentence,
  generateWordOrder,
  generateWordOrderBatch,
  evaluateWordOrder,
} from './wordOrderGenerator';

describe('tokenizeSentence', () => {
  it('should split into words', () => {
    expect(tokenizeSentence('Ik ga naar school.')).toEqual([
      'Ik', 'ga', 'naar', 'school.',
    ]);
  });

  it('should handle extra whitespace', () => {
    expect(tokenizeSentence('  Hallo   wereld  ')).toEqual(['Hallo', 'wereld']);
  });

  it('should keep punctuation attached', () => {
    expect(tokenizeSentence('Hoe gaat het?')).toEqual(['Hoe', 'gaat', 'het?']);
  });

  it('should handle commas in middle', () => {
    expect(tokenizeSentence('Bruin, alstublieft.')).toEqual(['Bruin,', 'alstublieft.']);
  });
});

describe('generateWordOrder', () => {
  const sentence = {
    id: 's1',
    text: 'Ik ga morgen naar de dokter.',
    translation: 'I am going to the doctor tomorrow.',
  };

  it('should return a valid exercise', () => {
    const result = generateWordOrder(sentence);
    expect(result).not.toBeNull();
    expect(result!.exerciseType).toBe('word-order');
    expect(result!.sourceEntityId).toBe('s1');
    expect(result!.correctSentence).toBe(sentence.text);
    expect(result!.translation).toBe(sentence.translation);
  });

  it('should shuffle tokens differently from original', () => {
    const result = generateWordOrder(sentence);
    expect(result).not.toBeNull();
    // Shuffled should contain same tokens but different order
    expect([...result!.shuffledTokens].sort()).toEqual(
      [...result!.correctTokens].sort(),
    );
    // At least one position should differ (not identical to original)
    const somePositionDiffers = result!.shuffledTokens.some(
      (t, i) => t !== result!.correctTokens[i],
    );
    expect(somePositionDiffers).toBe(true);
  });

  it('should return null for short sentences (< 3 tokens)', () => {
    expect(generateWordOrder({ id: 's2', text: 'Ja nee', translation: 'Yes no' })).toBeNull();
    expect(generateWordOrder({ id: 's3', text: 'Hallo!', translation: 'Hello!' })).toBeNull();
  });

  it('should include correct tokens in order', () => {
    const result = generateWordOrder(sentence);
    expect(result!.correctTokens).toEqual([
      'Ik', 'ga', 'morgen', 'naar', 'de', 'dokter.',
    ]);
  });
});

describe('generateWordOrderBatch', () => {
  const sentences = [
    { id: 's1', text: 'Ik ga naar school.', translation: 'I go to school.' },
    { id: 's2', text: 'De kat zit op de mat.', translation: 'The cat sits on the mat.' },
    { id: 's3', text: 'Hoe gaat het met u?', translation: 'How are you?' },
    { id: 's4', text: 'Ja.', translation: 'Yes.' }, // too short
  ];

  it('should generate multiple exercises', () => {
    const result = generateWordOrderBatch(sentences);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('should respect maxExercises', () => {
    const result = generateWordOrderBatch(sentences, 1);
    expect(result).toHaveLength(1);
  });

  it('should skip short sentences', () => {
    const result = generateWordOrderBatch(sentences, 10);
    const ids = result.map((e) => e.sourceEntityId);
    expect(ids).not.toContain('s4');
  });
});

describe('evaluateWordOrder', () => {
  it('should accept correct order', () => {
    const result = evaluateWordOrder(
      ['Ik', 'ga', 'naar', 'school.'],
      ['Ik', 'ga', 'naar', 'school.'],
    );
    expect(result.correct).toBe(true);
  });

  it('should be case-insensitive', () => {
    const result = evaluateWordOrder(
      ['ik', 'ga', 'naar', 'school.'],
      ['Ik', 'ga', 'naar', 'school.'],
    );
    expect(result.correct).toBe(true);
  });

  it('should be punctuation-tolerant', () => {
    const result = evaluateWordOrder(
      ['Ik', 'ga', 'naar', 'school'],
      ['Ik', 'ga', 'naar', 'school.'],
    );
    expect(result.correct).toBe(true);
  });

  it('should reject wrong order', () => {
    const result = evaluateWordOrder(
      ['ga', 'Ik', 'naar', 'school.'],
      ['Ik', 'ga', 'naar', 'school.'],
    );
    expect(result.correct).toBe(false);
  });

  it('should return both sentences', () => {
    const result = evaluateWordOrder(
      ['ga', 'Ik'],
      ['Ik', 'ga'],
    );
    expect(result.userSentence).toBe('ga Ik');
    expect(result.correctSentence).toBe('Ik ga');
  });
});
