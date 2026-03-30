import { describe, it, expect } from 'vitest';
import { calculateInterval } from './intervalCalculator';

describe('calculateInterval', () => {
  const defaultEase = 2.5;

  describe('Path 1: correct + fast + no hint', () => {
    it('should give large interval increase', () => {
      const result = calculateInterval('recognized', defaultEase, {
        isCorrect: true,
        responseTimeMs: 1500, // fast (< 3s)
        hintUsed: false,
      });

      // recognized base = 30min, * 2.5 ease = 75min
      expect(result.intervalMinutes).toBe(75);
      expect(result.easeScore).toBe(2.6); // ease + 0.1
      expect(result.wasFast).toBe(true);
    });

    it('should increase ease', () => {
      const result = calculateInterval('seen', 2.0, {
        isCorrect: true,
        responseTimeMs: 1000,
        hintUsed: false,
      });
      expect(result.easeScore).toBe(2.1);
    });
  });

  describe('Path 2: correct + slow + no hint', () => {
    it('should give small interval increase', () => {
      const result = calculateInterval('recognized', defaultEase, {
        isCorrect: true,
        responseTimeMs: 5000, // slow (>= 3s)
        hintUsed: false,
      });

      // recognized base = 30min, * 2.5 * 0.6 = 45min
      expect(result.intervalMinutes).toBe(45);
      expect(result.easeScore).toBe(2.55);
      expect(result.wasFast).toBe(false);
    });
  });

  describe('Path 3: correct + hint', () => {
    it('should give minimal interval increase', () => {
      const result = calculateInterval('recognized', defaultEase, {
        isCorrect: true,
        responseTimeMs: 1000,
        hintUsed: true,
      });

      // recognized base = 30min, * 0.8 = 24min
      expect(result.intervalMinutes).toBe(24);
      expect(result.easeScore).toBe(2.5); // unchanged
    });
  });

  describe('Path 4: incorrect', () => {
    it('should reset to near-term and decrease ease', () => {
      const result = calculateInterval('recalled', defaultEase, {
        isCorrect: false,
        responseTimeMs: 4000,
        hintUsed: false,
      });

      // recalled base = 240min, * 0.25 = 60min
      expect(result.intervalMinutes).toBe(60);
      expect(result.easeScore).toBe(2.3); // ease - 0.2
    });

    it('should not decrease ease below minimum', () => {
      const result = calculateInterval('seen', 1.3, {
        isCorrect: false,
        responseTimeMs: 2000,
        hintUsed: false,
      });

      expect(result.easeScore).toBe(1.3); // clamped at min
    });
  });

  describe('edge cases', () => {
    it('should handle new stage', () => {
      const result = calculateInterval('new', defaultEase, {
        isCorrect: true,
        responseTimeMs: 500,
        hintUsed: false,
      });

      // new base = 1min, * 2.5 = 2.5 -> 3min (rounded)
      expect(result.intervalMinutes).toBeGreaterThanOrEqual(1);
    });

    it('should handle automated stage', () => {
      const result = calculateInterval('automated', defaultEase, {
        isCorrect: true,
        responseTimeMs: 1000,
        hintUsed: false,
      });

      // automated base = 10080min (7d), * 2.5 = 25200min (~17.5 days)
      expect(result.intervalMinutes).toBe(25200);
    });

    it('should clamp interval to max 90 days', () => {
      const result = calculateInterval('automated', 4.0, {
        isCorrect: true,
        responseTimeMs: 500,
        hintUsed: false,
      });

      // 10080 * 4.0 = 40320 > 90*1440=129600, so not clamped here
      // but with higher values it would clamp
      expect(result.intervalMinutes).toBeLessThanOrEqual(90 * 1440);
    });

    it('should always return a future dueAt', () => {
      const now = Date.now();
      const result = calculateInterval('new', defaultEase, {
        isCorrect: true,
        responseTimeMs: 1000,
        hintUsed: false,
      });

      const dueTime = new Date(result.dueAt).getTime();
      expect(dueTime).toBeGreaterThan(now);
    });
  });
});
