import { describe, it, expect } from 'vitest';
import { generateGapFill, generateGapFillBatch } from './gapFillGenerator';

const vocab = [
  {
    id: 'v1',
    lemma: 'dokter',
    displayText: 'de dokter',
    partOfSpeech: 'noun',
  },
  {
    id: 'v2',
    lemma: 'school',
    displayText: 'de school',
    partOfSpeech: 'noun',
  },
  {
    id: 'v3',
    lemma: 'appel',
    displayText: 'de appel',
    partOfSpeech: 'noun',
  },
  {
    id: 'v4',
    lemma: 'regen',
    displayText: 'de regen',
    partOfSpeech: 'noun',
  },
  {
    id: 'v5',
    lemma: 'afspraak',
    displayText: 'de afspraak',
    partOfSpeech: 'noun',
  },
];

const sentences = [
  {
    id: 's1',
    text: 'Ik ga morgen naar de dokter.',
    translation: 'I am going to the doctor tomorrow.',
  },
  {
    id: 's2',
    text: 'Ik wil graag een afspraak maken.',
    translation: 'I would like to make an appointment.',
  },
  {
    id: 's3',
    text: 'Het regent vandaag.',
    translation: 'It is raining today.',
  },
];

describe('generateGapFill', () => {
  it('should generate a valid gap-fill exercise', () => {
    const exercise = generateGapFill(sentences[0], vocab[0], vocab);

    expect(exercise).not.toBeNull();
    expect(exercise!.exerciseType).toBe('multiple-choice-gap-fill');
    expect(exercise!.renderedPrompt).toBe('Ik ga morgen naar de ____.');
    expect(exercise!.correctAnswer).toBe('dokter');
    expect(exercise!.options).toHaveLength(4); // 1 correct + 3 distractors
    expect(exercise!.options).toContain('dokter');
    expect(exercise!.sourceEntityId).toBe('s1');
    expect(exercise!.sentenceTranslation).toBe(
      'I am going to the doctor tomorrow.',
    );
  });

  it('should return correctIndex pointing to correct answer', () => {
    const exercise = generateGapFill(sentences[0], vocab[0], vocab);
    expect(exercise).not.toBeNull();
    expect(exercise!.options[exercise!.correctIndex]).toBe('dokter');
  });

  it('should return null when target word is not in sentence', () => {
    const exercise = generateGapFill(sentences[0], vocab[2], vocab); // "appel" not in sentence[0]
    expect(exercise).toBeNull();
  });

  it('should handle word at different positions', () => {
    const exercise = generateGapFill(sentences[1], vocab[4], vocab); // "afspraak" in sentence[1]
    expect(exercise).not.toBeNull();
    expect(exercise!.renderedPrompt).toContain('____');
    expect(exercise!.renderedPrompt).not.toContain('afspraak');
    expect(exercise!.correctAnswer).toBe('afspraak');
  });

  it('should preserve gap position', () => {
    const exercise = generateGapFill(sentences[0], vocab[0], vocab);
    expect(exercise).not.toBeNull();
    expect(exercise!.gapPosition.start).toBeGreaterThanOrEqual(0);
    expect(exercise!.gapPosition.end).toBeGreaterThan(
      exercise!.gapPosition.start,
    );
  });
});

describe('generateGapFillBatch', () => {
  it('should generate multiple exercises', () => {
    const exercises = generateGapFillBatch(sentences, vocab, 10);
    // s1 matches "dokter", s2 matches "afspraak", s3 doesn't match any vocab directly
    expect(exercises.length).toBeGreaterThanOrEqual(2);
  });

  it('should respect maxExercises limit', () => {
    const exercises = generateGapFillBatch(sentences, vocab, 1);
    expect(exercises).toHaveLength(1);
  });

  it('should handle empty inputs', () => {
    expect(generateGapFillBatch([], vocab)).toHaveLength(0);
    expect(generateGapFillBatch(sentences, [])).toHaveLength(0);
  });
});
