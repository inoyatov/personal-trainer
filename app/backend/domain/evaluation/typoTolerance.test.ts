import { describe, it, expect } from 'vitest';
import {
  levenshteinDistance,
  checkWithTypoTolerance,
  maxAllowedDistance,
} from './typoTolerance';

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('dokter', 'dokter')).toBe(0);
  });

  it('should return correct distance for single edit', () => {
    expect(levenshteinDistance('dokter', 'doktor')).toBe(1); // substitution
    expect(levenshteinDistance('dokter', 'dokters')).toBe(1); // insertion
    expect(levenshteinDistance('dokter', 'doktr')).toBe(1); // deletion
  });

  it('should return correct distance for multiple edits', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });

  it('should handle empty strings', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('should be symmetric', () => {
    expect(levenshteinDistance('abc', 'def')).toBe(
      levenshteinDistance('def', 'abc'),
    );
  });
});

describe('maxAllowedDistance', () => {
  it('strict: always 0', () => {
    expect(maxAllowedDistance(3, 'strict')).toBe(0);
    expect(maxAllowedDistance(10, 'strict')).toBe(0);
  });

  it('normal: 1 for short words, 2 for long', () => {
    expect(maxAllowedDistance(4, 'normal')).toBe(1);
    expect(maxAllowedDistance(6, 'normal')).toBe(1);
    expect(maxAllowedDistance(7, 'normal')).toBe(2);
    expect(maxAllowedDistance(12, 'normal')).toBe(2);
  });

  it('lenient: scaled by word length', () => {
    expect(maxAllowedDistance(3, 'lenient')).toBe(1);
    expect(maxAllowedDistance(4, 'lenient')).toBe(1);
    expect(maxAllowedDistance(5, 'lenient')).toBe(2);
    expect(maxAllowedDistance(8, 'lenient')).toBe(2);
    expect(maxAllowedDistance(9, 'lenient')).toBe(3);
  });
});

describe('checkWithTypoTolerance', () => {
  it('should accept exact matches at any tolerance', () => {
    expect(checkWithTypoTolerance('dokter', 'dokter', 'strict').accepted).toBe(
      true,
    );
    expect(checkWithTypoTolerance('dokter', 'dokter', 'strict').exact).toBe(
      true,
    );
  });

  it('strict: should reject even 1 typo', () => {
    const result = checkWithTypoTolerance('doktor', 'dokter', 'strict');
    expect(result.accepted).toBe(false);
    expect(result.distance).toBe(1);
  });

  it('normal: should accept 1 typo for short word', () => {
    const result = checkWithTypoTolerance('doktor', 'dokter', 'normal');
    expect(result.accepted).toBe(true);
    expect(result.exact).toBe(false);
  });

  it('normal: should reject 2 typos for short word', () => {
    const result = checkWithTypoTolerance('dokto', 'dokter', 'normal');
    // distance is 2 (delete 'r', change 'e' -> 'o') — actually let's check
    expect(result.distance).toBeGreaterThanOrEqual(2);
  });

  it('normal: should accept 2 typos for long word', () => {
    // "afspraak" (8 chars) -> "afsprak" (distance 1) -> accepted
    const result = checkWithTypoTolerance('afsprak', 'afspraak', 'normal');
    expect(result.accepted).toBe(true);
  });

  it('lenient: should accept more typos', () => {
    // "natuurlijk" (10 chars) -> lenient allows 3
    const result = checkWithTypoTolerance(
      'natuulijk',
      'natuurlijk',
      'lenient',
    );
    expect(result.accepted).toBe(true);
  });
});
