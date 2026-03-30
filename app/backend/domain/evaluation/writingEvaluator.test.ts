import { describe, it, expect } from 'vitest';
import { evaluateWriting } from './writingEvaluator';

describe('writingEvaluator', () => {
  const keywords = ['ziek', 'komen', 'morgen', 'dokter'];
  const patterns = ['Ik ben ziek', 'Ik kan niet komen'];

  it('should give high score for good writing', () => {
    const result = evaluateWriting({
      text: 'Ik ben ziek. Ik kan morgen niet komen. Ik ga naar de dokter.',
      expectedKeywords: keywords,
      targetPatterns: patterns,
    });

    expect(result.score).toBeGreaterThanOrEqual(0.7);
    expect(result.checks.find((c) => c.name === 'Keyword coverage')?.passed).toBe(true);
    expect(result.checks.find((c) => c.name === 'Capitalization')?.passed).toBe(true);
    expect(result.checks.find((c) => c.name === 'Punctuation')?.passed).toBe(true);
  });

  it('should penalize empty text', () => {
    const result = evaluateWriting({
      text: '',
      expectedKeywords: keywords,
      targetPatterns: patterns,
    });
    expect(result.score).toBe(0);
  });

  it('should penalize too short text', () => {
    const result = evaluateWriting({
      text: 'Ik ben ziek.',
      expectedKeywords: keywords,
      targetPatterns: patterns,
    });
    const minLength = result.checks.find((c) => c.name === 'Minimum length');
    expect(minLength?.passed).toBe(false);
  });

  it('should detect missing capitalization', () => {
    const result = evaluateWriting({
      text: 'ik ben ziek. ik kan niet komen morgen.',
      expectedKeywords: keywords,
      targetPatterns: patterns,
    });
    const cap = result.checks.find((c) => c.name === 'Capitalization');
    expect(cap?.passed).toBe(false);
  });

  it('should detect missing end punctuation', () => {
    const result = evaluateWriting({
      text: 'Ik ben ziek en ik kan morgen niet komen',
      expectedKeywords: keywords,
      targetPatterns: patterns,
    });
    const punct = result.checks.find((c) => c.name === 'Punctuation');
    expect(punct?.passed).toBe(false);
  });

  it('should report missing keywords', () => {
    const result = evaluateWriting({
      text: 'Ik ga naar huis. Het is mooi weer vandaag.',
      expectedKeywords: keywords,
      targetPatterns: [],
    });
    const kw = result.checks.find((c) => c.name === 'Keyword coverage');
    expect(kw?.passed).toBe(false);
    expect(kw?.message).toContain('ziek');
  });

  it('should detect target patterns', () => {
    const result = evaluateWriting({
      text: 'Ik ben ziek en kan niet komen morgen.',
      expectedKeywords: keywords,
      targetPatterns: patterns,
    });
    const tp = result.checks.find((c) => c.name === 'Target patterns');
    expect(tp).toBeDefined();
    expect(tp?.passed).toBe(true);
  });

  it('should work with no keywords or patterns', () => {
    const result = evaluateWriting({
      text: 'Ik woon in Amsterdam. Het is een mooie stad.',
      expectedKeywords: [],
      targetPatterns: [],
    });
    expect(result.score).toBeGreaterThan(0);
  });
});
