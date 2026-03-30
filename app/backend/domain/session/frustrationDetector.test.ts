import { describe, it, expect } from 'vitest';
import { detectFrustration, frustrationMessage, type AnswerSignal } from './frustrationDetector';

function makeAnswers(count: number, overrides: Partial<AnswerSignal> = {}): AnswerSignal[] {
  return Array.from({ length: count }, () => ({
    isCorrect: true,
    responseTimeMs: 2000,
    hintUsed: false,
    ...overrides,
  }));
}

describe('detectFrustration', () => {
  it('should not detect frustration with good answers', () => {
    const answers = makeAnswers(10, { isCorrect: true, responseTimeMs: 2000 });
    const result = detectFrustration(answers);
    expect(result.isFrustrated).toBe(false);
    expect(result.triggerReason).toBeNull();
  });

  it('should not detect with fewer than 3 answers', () => {
    const answers = makeAnswers(2, { isCorrect: false });
    const result = detectFrustration(answers);
    expect(result.isFrustrated).toBe(false);
  });

  it('should detect high error rate', () => {
    const answers = [
      ...makeAnswers(6, { isCorrect: true }),
      ...makeAnswers(4, { isCorrect: false }),
    ];
    const result = detectFrustration(answers);
    expect(result.isFrustrated).toBe(true);
    expect(result.triggerReason).toBe('high error rate');
    expect(result.errorRate).toBeCloseTo(0.4, 1);
  });

  it('should detect slow responses', () => {
    const answers = makeAnswers(5, { responseTimeMs: 9000 });
    const result = detectFrustration(answers);
    expect(result.isFrustrated).toBe(true);
    expect(result.triggerReason).toBe('slow responses');
  });

  it('should detect frequent hint usage', () => {
    const answers = makeAnswers(10, { hintUsed: true });
    const result = detectFrustration(answers);
    expect(result.isFrustrated).toBe(true);
    expect(result.triggerReason).toBe('frequent hint usage');
  });

  it('should use sliding window of last 10', () => {
    // 15 answers: first 10 bad, last 5 good
    const answers = [
      ...makeAnswers(10, { isCorrect: false }),
      ...makeAnswers(5, { isCorrect: true }),
    ];
    const result = detectFrustration(answers);
    // Window is last 10: 5 bad + 5 good = 0.5 error rate → frustrated
    expect(result.isFrustrated).toBe(true);
  });

  it('should not trigger when just below thresholds', () => {
    // 3 errors in 10 = 0.3 (below 0.4)
    const answers = [
      ...makeAnswers(7, { isCorrect: true }),
      ...makeAnswers(3, { isCorrect: false }),
    ];
    const result = detectFrustration(answers);
    expect(result.isFrustrated).toBe(false);
  });

  it('should prioritize error rate over other triggers', () => {
    const answers = makeAnswers(10, {
      isCorrect: false,
      responseTimeMs: 9000,
      hintUsed: true,
    });
    const result = detectFrustration(answers);
    expect(result.triggerReason).toBe('high error rate');
  });
});

describe('frustrationMessage', () => {
  it('should return appropriate message for error rate', () => {
    const msg = frustrationMessage({
      isFrustrated: true,
      errorRate: 0.5,
      avgResponseTime: 3000,
      hintRate: 0.1,
      triggerReason: 'high error rate',
    });
    expect(msg).toContain('review');
  });

  it('should return appropriate message for slow responses', () => {
    const msg = frustrationMessage({
      isFrustrated: true,
      errorRate: 0.1,
      avgResponseTime: 9000,
      hintRate: 0.1,
      triggerReason: 'slow responses',
    });
    expect(msg).toContain('rush');
  });

  it('should return empty string when not frustrated', () => {
    const msg = frustrationMessage({
      isFrustrated: false,
      errorRate: 0,
      avgResponseTime: 2000,
      hintRate: 0,
      triggerReason: null,
    });
    expect(msg).toBe('');
  });
});
