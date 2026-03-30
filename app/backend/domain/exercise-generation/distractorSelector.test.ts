import { describe, it, expect } from 'vitest';
import { selectDistractors, shuffleOptions } from './distractorSelector';

const pool = [
  { id: 'v1', lemma: 'dokter', partOfSpeech: 'noun' },
  { id: 'v2', lemma: 'school', partOfSpeech: 'noun' },
  { id: 'v3', lemma: 'appel', partOfSpeech: 'noun' },
  { id: 'v4', lemma: 'regen', partOfSpeech: 'noun' },
  { id: 'v5', lemma: 'lopen', partOfSpeech: 'verb' },
  { id: 'v6', lemma: 'eten', partOfSpeech: 'verb' },
  { id: 'v7', lemma: 'groot', partOfSpeech: 'adjective' },
];

describe('selectDistractors', () => {
  it('should return requested number of distractors', () => {
    const result = selectDistractors('dokter', 'noun', pool, { count: 3 });
    expect(result).toHaveLength(3);
  });

  it('should not include the target word', () => {
    const result = selectDistractors('dokter', 'noun', pool, { count: 5 });
    expect(result).not.toContain('dokter');
  });

  it('should prefer same part of speech', () => {
    const result = selectDistractors('dokter', 'noun', pool, {
      count: 3,
      preferSamePartOfSpeech: true,
    });
    // With 3 other nouns available (school, appel, regen), all should be nouns
    const nouns = pool
      .filter((v) => v.partOfSpeech === 'noun' && v.lemma !== 'dokter')
      .map((v) => v.lemma);
    for (const d of result) {
      expect(nouns).toContain(d);
    }
  });

  it('should fall back to other POS when not enough same-POS candidates', () => {
    const result = selectDistractors('lopen', 'verb', pool, { count: 3 });
    expect(result).toHaveLength(3);
    expect(result).not.toContain('lopen');
  });

  it('should handle empty pool gracefully', () => {
    const result = selectDistractors('dokter', 'noun', [], { count: 3 });
    expect(result).toHaveLength(0);
  });

  it('should handle pool smaller than requested count', () => {
    const smallPool = [
      { id: 'v1', lemma: 'school', partOfSpeech: 'noun' },
    ];
    const result = selectDistractors('dokter', 'noun', smallPool, {
      count: 3,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('school');
  });

  it('should be case-insensitive when excluding target', () => {
    const result = selectDistractors('Dokter', 'noun', pool, { count: 3 });
    expect(result).not.toContain('dokter');
    expect(result).not.toContain('Dokter');
  });
});

describe('shuffleOptions', () => {
  it('should include correct answer and all distractors', () => {
    const { options } = shuffleOptions('dokter', ['school', 'appel', 'regen']);
    expect(options).toHaveLength(4);
    expect(options).toContain('dokter');
    expect(options).toContain('school');
    expect(options).toContain('appel');
    expect(options).toContain('regen');
  });

  it('should return valid correctIndex', () => {
    const { options, correctIndex } = shuffleOptions('dokter', [
      'school',
      'appel',
      'regen',
    ]);
    expect(options[correctIndex]).toBe('dokter');
  });
});
