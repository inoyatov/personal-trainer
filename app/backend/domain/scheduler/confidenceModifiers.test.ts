import { describe, it, expect } from 'vitest';
import {
  applyConfidenceToInterval,
  overconfidencePenalty,
  shouldHoldStageAdvancement,
  confidenceFeedback,
} from './confidenceModifiers';

describe('applyConfidenceToInterval', () => {
  it('should shorten interval for guess (confidence=0)', () => {
    expect(applyConfidenceToInterval(100, 0)).toBe(70); // 100 * 0.7
  });

  it('should keep interval for normal confidence (confidence=1)', () => {
    expect(applyConfidenceToInterval(100, 1)).toBe(100);
  });

  it('should lengthen interval for confident (confidence=2)', () => {
    expect(applyConfidenceToInterval(100, 2)).toBe(120); // 100 * 1.2
  });

  it('should handle small intervals', () => {
    expect(applyConfidenceToInterval(1, 0)).toBe(1); // rounds to 1
    expect(applyConfidenceToInterval(5, 2)).toBe(6);
  });
});

describe('overconfidencePenalty', () => {
  it('should return -0.08 for confident + incorrect', () => {
    expect(overconfidencePenalty(2, false)).toBe(-0.08);
  });

  it('should return 0 for confident + correct', () => {
    expect(overconfidencePenalty(2, true)).toBe(0);
  });

  it('should return 0 for not confident + incorrect', () => {
    expect(overconfidencePenalty(1, false)).toBe(0);
    expect(overconfidencePenalty(0, false)).toBe(0);
  });
});

describe('shouldHoldStageAdvancement', () => {
  it('should hold for guess + correct', () => {
    expect(shouldHoldStageAdvancement(0, true)).toBe(true);
  });

  it('should not hold for guess + incorrect', () => {
    expect(shouldHoldStageAdvancement(0, false)).toBe(false);
  });

  it('should not hold for normal confidence', () => {
    expect(shouldHoldStageAdvancement(1, true)).toBe(false);
    expect(shouldHoldStageAdvancement(2, true)).toBe(false);
  });
});

describe('confidenceFeedback', () => {
  it('should return overconfidence message', () => {
    const msg = confidenceFeedback(2, false);
    expect(msg).toContain('confident');
    expect(msg).toContain('practice');
  });

  it('should return reinforcement message for lucky guess', () => {
    const msg = confidenceFeedback(0, true);
    expect(msg).toContain('reinforce');
  });

  it('should return null for normal combinations', () => {
    expect(confidenceFeedback(1, true)).toBeNull();
    expect(confidenceFeedback(1, false)).toBeNull();
    expect(confidenceFeedback(2, true)).toBeNull();
    expect(confidenceFeedback(0, false)).toBeNull();
  });
});
