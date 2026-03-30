import { describe, it, expect } from 'vitest';
import { generateCompetenceSignals, type ProgressSnapshot } from './competenceSignals';

const baseSnapshot: ProgressSnapshot = {
  totalItemsLearned: 0,
  totalSessions: 0,
  todayAccuracy: 0,
  reviewStates: [],
  lessonCompletions: [],
};

describe('generateCompetenceSignals', () => {
  it('should return empty for no progress', () => {
    const signals = generateCompetenceSignals(baseSnapshot);
    expect(signals).toHaveLength(0);
  });

  it('should signal item learning milestones', () => {
    const signals = generateCompetenceSignals({
      ...baseSnapshot,
      totalItemsLearned: 15,
    });
    expect(signals.some((s) => s.message.includes('15 items'))).toBe(true);
  });

  it('should signal 50+ items', () => {
    const signals = generateCompetenceSignals({
      ...baseSnapshot,
      totalItemsLearned: 55,
    });
    expect(signals.some((s) => s.message.includes('50'))).toBe(true);
  });

  it('should signal session milestones', () => {
    const signals = generateCompetenceSignals({
      ...baseSnapshot,
      totalSessions: 12,
    });
    expect(signals.some((s) => s.message.includes('12 study sessions'))).toBe(true);
  });

  it('should signal completed lessons', () => {
    const signals = generateCompetenceSignals({
      ...baseSnapshot,
      lessonCompletions: [
        { lessonId: 'l1', lessonTitle: 'Bij de bakker', overallPercent: 100, isComplete: true },
      ],
    });
    expect(signals.some((s) => s.message.includes('Bij de bakker'))).toBe(true);
    expect(signals.some((s) => s.category === 'milestone')).toBe(true);
  });

  it('should signal stable items', () => {
    const stableItems = Array.from({ length: 6 }, (_, i) => ({
      entityType: 'vocab',
      entityId: `v-${i}`,
      currentStage: 'stable',
    }));
    const signals = generateCompetenceSignals({
      ...baseSnapshot,
      reviewStates: stableItems,
    });
    expect(signals.some((s) => s.message.includes('stable'))).toBe(true);
  });

  it('should signal high accuracy', () => {
    const signals = generateCompetenceSignals({
      ...baseSnapshot,
      todayAccuracy: 90,
      totalSessions: 5,
    });
    expect(signals.some((s) => s.message.includes('90%'))).toBe(true);
  });

  it('should signal near-complete lessons', () => {
    const signals = generateCompetenceSignals({
      ...baseSnapshot,
      lessonCompletions: [
        { lessonId: 'l1', lessonTitle: 'Op de markt', overallPercent: 75, isComplete: false },
      ],
    });
    expect(signals.some((s) => s.message.includes('almost there'))).toBe(true);
  });
});
