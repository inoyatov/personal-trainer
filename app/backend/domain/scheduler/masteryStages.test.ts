import { describe, it, expect } from 'vitest';
import { upgradeStage, downgradeStage, stageIndex, STAGE_ORDER } from './masteryStages';

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

  describe('upgradeStage', () => {
    it('should advance to next stage', () => {
      expect(upgradeStage('new')).toBe('seen');
      expect(upgradeStage('seen')).toBe('recognized');
      expect(upgradeStage('recognized')).toBe('recalled');
      expect(upgradeStage('recalled')).toBe('stable');
      expect(upgradeStage('stable')).toBe('automated');
    });

    it('should stay at automated (max)', () => {
      expect(upgradeStage('automated')).toBe('automated');
    });
  });

  describe('downgradeStage', () => {
    it('should go back one stage', () => {
      expect(downgradeStage('automated')).toBe('stable');
      expect(downgradeStage('stable')).toBe('recalled');
      expect(downgradeStage('recalled')).toBe('recognized');
      expect(downgradeStage('recognized')).toBe('seen');
    });

    it('should not go below seen', () => {
      expect(downgradeStage('seen')).toBe('seen');
      expect(downgradeStage('new')).toBe('seen');
    });
  });
});
