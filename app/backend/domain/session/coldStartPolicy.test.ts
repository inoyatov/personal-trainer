import { describe, it, expect } from 'vitest';
import { getColdStartDistribution, FULL_DISTRIBUTION } from './coldStartPolicy';

describe('getColdStartDistribution', () => {
  it('returns early distribution for session 0 (first ever)', () => {
    const dist = getColdStartDistribution(0);
    expect(dist.vocabulary).toBe(0.80);
    expect(dist.sentence).toBe(0.20);
    expect(dist.conjugation).toBe(0);
    expect(dist.dialog).toBe(0);
  });

  it('returns early distribution for sessions 1-2', () => {
    expect(getColdStartDistribution(1).vocabulary).toBe(0.80);
    expect(getColdStartDistribution(2).vocabulary).toBe(0.80);
  });

  it('returns mid distribution for session 3', () => {
    const dist = getColdStartDistribution(3);
    expect(dist.vocabulary).toBe(0.60);
    expect(dist.sentence).toBe(0.25);
    expect(dist.conjugation).toBe(0.15);
    expect(dist.dialog).toBe(0);
  });

  it('returns mid distribution for sessions 4-9', () => {
    expect(getColdStartDistribution(5).conjugation).toBe(0.15);
    expect(getColdStartDistribution(9).conjugation).toBe(0.15);
  });

  it('returns full distribution for session 10+', () => {
    expect(getColdStartDistribution(10)).toEqual(FULL_DISTRIBUTION);
    expect(getColdStartDistribution(100)).toEqual(FULL_DISTRIBUTION);
  });

  it('all distributions sum to 1.0', () => {
    for (const count of [0, 1, 2, 3, 5, 9, 10, 50]) {
      const dist = getColdStartDistribution(count);
      const sum = dist.vocabulary + dist.conjugation + dist.sentence + dist.dialog;
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });
});
