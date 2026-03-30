import { describe, it, expect } from 'vitest';
import { normalizeAnswer, answersMatch } from './answerNormalizer';

describe('normalizeAnswer', () => {
  it('should trim whitespace', () => {
    expect(normalizeAnswer('  dokter  ')).toBe('dokter');
  });

  it('should lowercase', () => {
    expect(normalizeAnswer('Dokter')).toBe('dokter');
  });

  it('should collapse multiple spaces', () => {
    expect(normalizeAnswer('de   dokter')).toBe('de dokter');
  });

  it('should strip trailing punctuation', () => {
    expect(normalizeAnswer('dokter.')).toBe('dokter');
    expect(normalizeAnswer('dokter!')).toBe('dokter');
    expect(normalizeAnswer('dokter?')).toBe('dokter');
    expect(normalizeAnswer('dokter,')).toBe('dokter');
  });

  it('should handle Unicode normalization', () => {
    // é composed vs decomposed
    const composed = 'caf\u00e9';
    const decomposed = 'cafe\u0301';
    expect(normalizeAnswer(composed)).toBe(normalizeAnswer(decomposed));
  });

  it('should handle empty string', () => {
    expect(normalizeAnswer('')).toBe('');
    expect(normalizeAnswer('   ')).toBe('');
  });
});

describe('answersMatch', () => {
  it('should match identical answers', () => {
    expect(answersMatch('dokter', 'dokter')).toBe(true);
  });

  it('should match with different casing', () => {
    expect(answersMatch('Dokter', 'dokter')).toBe(true);
  });

  it('should match with trailing punctuation', () => {
    expect(answersMatch('dokter.', 'dokter')).toBe(true);
  });

  it('should match with extra whitespace', () => {
    expect(answersMatch(' dokter ', 'dokter')).toBe(true);
  });

  it('should not match different words', () => {
    expect(answersMatch('school', 'dokter')).toBe(false);
  });
});
