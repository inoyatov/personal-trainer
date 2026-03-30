import { describe, it, expect } from 'vitest';
import {
  detectStruggling,
  detectFastSuccess,
  computeAdaptation,
  type AnswerSignal,
} from './adaptationPolicy';

function makeAnswer(isCorrect: boolean, responseTimeMs = 2000): AnswerSignal {
  return { isCorrect, responseTimeMs };
}

describe('detectStruggling', () => {
  it('returns false with fewer than 3 answers', () => {
    expect(detectStruggling([makeAnswer(false), makeAnswer(false)])).toBe(false);
  });

  it('returns true when accuracy < 0.6 over last 10', () => {
    // 3 correct, 7 incorrect = 30% accuracy
    const answers = [
      ...Array(3).fill(null).map(() => makeAnswer(true)),
      ...Array(7).fill(null).map(() => makeAnswer(false)),
    ];
    expect(detectStruggling(answers)).toBe(true);
  });

  it('returns false when accuracy is exactly 0.6 and no consecutive errors', () => {
    // 6 correct, 4 incorrect interleaved = 60% accuracy, no 3 consecutive
    const answers = [
      makeAnswer(true), makeAnswer(false),
      makeAnswer(true), makeAnswer(false),
      makeAnswer(true), makeAnswer(true),
      makeAnswer(false), makeAnswer(true),
      makeAnswer(true), makeAnswer(false),
    ];
    expect(detectStruggling(answers)).toBe(false);
  });

  it('returns true on 3 consecutive errors at the end', () => {
    const answers = [
      ...Array(7).fill(null).map(() => makeAnswer(true)),
      makeAnswer(false),
      makeAnswer(false),
      makeAnswer(false),
    ];
    // accuracy = 70% (above threshold) but 3 consecutive errors
    expect(detectStruggling(answers)).toBe(true);
  });

  it('returns false when consecutive errors are not at the end', () => {
    const answers = [
      makeAnswer(false),
      makeAnswer(false),
      makeAnswer(false),
      ...Array(7).fill(null).map(() => makeAnswer(true)),
    ];
    expect(detectStruggling(answers)).toBe(false);
  });

  it('only considers last 10 answers', () => {
    // 15 answers: first 5 wrong, then 10 correct
    const answers = [
      ...Array(5).fill(null).map(() => makeAnswer(false)),
      ...Array(10).fill(null).map(() => makeAnswer(true)),
    ];
    expect(detectStruggling(answers)).toBe(false);
  });
});

describe('detectFastSuccess', () => {
  it('returns true when correct and fast', () => {
    expect(detectFastSuccess({ isCorrect: true, responseTimeMs: 1000 })).toBe(true);
  });

  it('returns false when correct but slow', () => {
    expect(detectFastSuccess({ isCorrect: true, responseTimeMs: 2000 })).toBe(false);
  });

  it('returns false when fast but incorrect', () => {
    expect(detectFastSuccess({ isCorrect: false, responseTimeMs: 500 })).toBe(false);
  });

  it('returns false at exactly 1500ms threshold', () => {
    expect(detectFastSuccess({ isCorrect: true, responseTimeMs: 1500 })).toBe(false);
  });
});

describe('computeAdaptation', () => {
  it('returns neutral state with no answers', () => {
    const state = computeAdaptation([]);
    expect(state.mcBoost).toBe(0);
    expect(state.typingBoost).toBe(0);
  });

  it('returns MC boost when struggling', () => {
    const answers = Array(10).fill(null).map(() => makeAnswer(false));
    const state = computeAdaptation(answers);
    expect(state.mcBoost).toBe(0.20);
    expect(state.typingBoost).toBe(-0.20);
  });

  it('returns typing boost when majority are fast successes', () => {
    // 8 fast correct, 2 slow correct = 80% fast success rate
    const answers = [
      ...Array(8).fill(null).map(() => makeAnswer(true, 1000)),
      ...Array(2).fill(null).map(() => makeAnswer(true, 3000)),
    ];
    const state = computeAdaptation(answers);
    expect(state.mcBoost).toBe(-0.10);
    expect(state.typingBoost).toBe(0.20);
  });

  it('struggling takes priority over fast success', () => {
    // Mostly wrong answers, even if fast
    const answers = Array(10).fill(null).map(() => makeAnswer(false, 800));
    const state = computeAdaptation(answers);
    expect(state.mcBoost).toBe(0.20); // struggling mode
  });

  it('returns neutral when performance is mixed', () => {
    const answers = [
      ...Array(5).fill(null).map(() => makeAnswer(true, 3000)),
      ...Array(3).fill(null).map(() => makeAnswer(false, 2000)),
      ...Array(2).fill(null).map(() => makeAnswer(true, 2000)),
    ];
    const state = computeAdaptation(answers);
    expect(state.mcBoost).toBe(0);
    expect(state.typingBoost).toBe(0);
  });
});
