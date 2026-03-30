import { describe, it, expect } from 'vitest';
import {
  upgradeStage,
  downgradeStage,
  stageIndex,
  STAGE_ORDER,
  computeStageFromMastery,
} from './masteryStages';

describe('masteryStages', () => {
  it('should have 6 stages in order', () => {
    expect(STAGE_ORDER).toHaveLength(6);
    expect(STAGE_ORDER[0]).toBe('new');
    expect(STAGE_ORDER[5]).toBe('automated');
  });

  it('stageIndex should return correct index', () => {
    expect(stageIndex('new')).toBe(0);
    expect(stageIndex('recalled')).toBe(3);
    expect(stageIndex('automated')).toBe(5);
  });

  describe('upgradeStage (legacy)', () => {
    it('should advance to next stage', () => {
      expect(upgradeStage('new')).toBe('seen');
      expect(upgradeStage('seen')).toBe('recognized');
      expect(upgradeStage('stable')).toBe('automated');
    });

    it('should stay at automated (max)', () => {
      expect(upgradeStage('automated')).toBe('automated');
    });
  });

  describe('downgradeStage (legacy)', () => {
    it('should go back one stage', () => {
      expect(downgradeStage('automated')).toBe('stable');
      expect(downgradeStage('recognized')).toBe('seen');
    });

    it('should not go below seen', () => {
      expect(downgradeStage('seen')).toBe('seen');
      expect(downgradeStage('new')).toBe('seen');
    });
  });
});

describe('computeStageFromMastery', () => {
  const base = {
    recognitionMastery: 0,
    recallMastery: 0,
    transferMastery: 0,
    totalCorrect: 0,
    consecutiveIncorrect: 0,
  };

  it('should return "new" when no correct answers', () => {
    expect(computeStageFromMastery(base)).toBe('new');
  });

  it('should return "seen" after first correct answer', () => {
    expect(computeStageFromMastery({ ...base, totalCorrect: 1 })).toBe('seen');
  });

  it('should return "recognized" when recognition >= 0.4', () => {
    expect(
      computeStageFromMastery({ ...base, totalCorrect: 5, recognitionMastery: 0.4 }),
    ).toBe('recognized');
  });

  it('should NOT return "recognized" when recognition < 0.4', () => {
    expect(
      computeStageFromMastery({ ...base, totalCorrect: 5, recognitionMastery: 0.3 }),
    ).toBe('seen');
  });

  it('should return "recalled" when recall >= 0.5', () => {
    expect(
      computeStageFromMastery({
        ...base,
        totalCorrect: 10,
        recognitionMastery: 0.6,
        recallMastery: 0.5,
      }),
    ).toBe('recalled');
  });

  it('should return "stable" when recall >= 0.75 and transfer >= 0.4', () => {
    expect(
      computeStageFromMastery({
        ...base,
        totalCorrect: 20,
        recognitionMastery: 0.8,
        recallMastery: 0.75,
        transferMastery: 0.4,
      }),
    ).toBe('stable');
  });

  it('should return "automated" when all >= 0.85 and low consecutive errors', () => {
    expect(
      computeStageFromMastery({
        ...base,
        totalCorrect: 50,
        recognitionMastery: 0.9,
        recallMastery: 0.9,
        transferMastery: 0.85,
        consecutiveIncorrect: 0,
      }),
    ).toBe('automated');
  });

  it('should NOT return "automated" with too many consecutive errors', () => {
    expect(
      computeStageFromMastery({
        ...base,
        totalCorrect: 50,
        recognitionMastery: 0.9,
        recallMastery: 0.9,
        transferMastery: 0.9,
        consecutiveIncorrect: 3,
      }),
    ).toBe('stable');
  });

  it('should downgrade from automated if mastery drops', () => {
    // If recall drops below 0.75, should drop to recalled
    expect(
      computeStageFromMastery({
        ...base,
        totalCorrect: 50,
        recognitionMastery: 0.9,
        recallMastery: 0.6,
        transferMastery: 0.3,
      }),
    ).toBe('recalled');
  });
});
