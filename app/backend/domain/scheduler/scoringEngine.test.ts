import { describe, it, expect } from 'vitest';
import {
  dueScore,
  errorScore,
  recencyScore,
  typeBoost,
  computeItemScore,
  type ScorableItem,
} from './scoringEngine';

const MS_PER_DAY = 86_400_000;
const NOW = new Date('2026-03-30T12:00:00Z');

function isoOffset(ms: number): string {
  return new Date(NOW.getTime() + ms).toISOString();
}

describe('dueScore', () => {
  it('returns 0 when dueAt is null (never scheduled)', () => {
    expect(dueScore(null, NOW)).toBe(0);
  });

  it('returns 0 when item is not yet due', () => {
    expect(dueScore(isoOffset(MS_PER_DAY), NOW)).toBe(0);
  });

  it('returns 0 when item is exactly at due time', () => {
    expect(dueScore(NOW.toISOString(), NOW)).toBe(0);
  });

  it('returns ~0.143 when 1 day overdue (1/7)', () => {
    expect(dueScore(isoOffset(-MS_PER_DAY), NOW)).toBeCloseTo(1 / 7, 3);
  });

  it('returns ~0.5 when 3.5 days overdue', () => {
    expect(dueScore(isoOffset(-3.5 * MS_PER_DAY), NOW)).toBeCloseTo(0.5, 3);
  });

  it('returns 1 when exactly 7 days overdue', () => {
    expect(dueScore(isoOffset(-7 * MS_PER_DAY), NOW)).toBe(1);
  });

  it('caps at 1 when more than 7 days overdue', () => {
    expect(dueScore(isoOffset(-14 * MS_PER_DAY), NOW)).toBe(1);
  });
});

describe('errorScore', () => {
  it('returns 0 when no errors', () => {
    expect(errorScore(0)).toBe(0);
  });

  it('returns 0.3 when 3 errors out of 10', () => {
    expect(errorScore(3)).toBeCloseTo(0.3);
  });

  it('returns 1 when 10 errors out of 10', () => {
    expect(errorScore(10)).toBe(1);
  });

  it('caps at 1 for values above 10', () => {
    expect(errorScore(15)).toBe(1);
  });

  it('floors at 0 for negative values', () => {
    expect(errorScore(-1)).toBe(0);
  });
});

describe('recencyScore', () => {
  it('returns 1 when lastSeenAt is null (never seen)', () => {
    expect(recencyScore(null, NOW)).toBe(1);
  });

  it('returns ~0 when just seen (0 seconds ago)', () => {
    expect(recencyScore(NOW.toISOString(), NOW)).toBeCloseTo(0, 5);
  });

  it('returns ~0.632 at 600 seconds (1 - e^-1)', () => {
    expect(recencyScore(isoOffset(-600_000), NOW)).toBeCloseTo(1 - Math.exp(-1), 3);
  });

  it('returns ~0.865 at 1200 seconds (1 - e^-2)', () => {
    expect(recencyScore(isoOffset(-1_200_000), NOW)).toBeCloseTo(1 - Math.exp(-2), 3);
  });

  it('approaches 1 for very old items', () => {
    expect(recencyScore(isoOffset(-3_600_000), NOW)).toBeGreaterThan(0.99);
  });

  it('returns 0 when lastSeenAt is in the future', () => {
    // Future lastSeenAt clamps to 0 seconds since seen
    expect(recencyScore(isoOffset(60_000), NOW)).toBe(0);
  });
});

describe('typeBoost', () => {
  it('returns 0.10 for vocabulary (not new)', () => {
    expect(typeBoost('vocabulary', false)).toBe(0.10);
  });

  it('returns 0.15 for conjugation (not new)', () => {
    expect(typeBoost('conjugation', false)).toBe(0.15);
  });

  it('returns 0.08 for sentence (not new)', () => {
    expect(typeBoost('sentence', false)).toBe(0.08);
  });

  it('returns 0.08 for dialog (not new)', () => {
    expect(typeBoost('dialog', false)).toBe(0.08);
  });

  it('returns 0.05 for any new item regardless of type', () => {
    expect(typeBoost('vocabulary', true)).toBe(0.05);
    expect(typeBoost('conjugation', true)).toBe(0.05);
    expect(typeBoost('sentence', true)).toBe(0.05);
    expect(typeBoost('dialog', true)).toBe(0.05);
  });
});

describe('computeItemScore', () => {
  function makeItem(overrides: Partial<ScorableItem> = {}): ScorableItem {
    return {
      entityId: 'test-1',
      entityType: 'vocabulary',
      isNew: false,
      dueAt: null,
      lastSeenAt: null,
      errorsLast10: 0,
      ...overrides,
    };
  }

  it('returns all component scores and the weighted total', () => {
    const result = computeItemScore(makeItem(), NOW);
    expect(result.components.dueScore).toBe(0);
    expect(result.components.errorScore).toBe(0);
    expect(result.components.recencyScore).toBe(1); // never seen
    expect(result.components.typeBoost).toBe(0.10); // vocabulary
    // score = 0.5*0 + 0.25*0 + 0.15*1 + 0.10*0.10 = 0.16
    expect(result.score).toBeCloseTo(0.16, 5);
  });

  it('scores an overdue item with errors highest', () => {
    const overdue = computeItemScore(
      makeItem({
        dueAt: isoOffset(-7 * MS_PER_DAY),
        lastSeenAt: isoOffset(-3_600_000),
        errorsLast10: 8,
        entityType: 'conjugation',
      }),
      NOW,
    );
    // due=1, error=0.8, recency≈1, type=0.15
    // score = 0.5*1 + 0.25*0.8 + 0.15*~1 + 0.10*0.15 ≈ 0.865
    expect(overdue.score).toBeGreaterThan(0.85);
  });

  it('scores a recently-seen, not-due item lowest', () => {
    const recent = computeItemScore(
      makeItem({
        dueAt: isoOffset(MS_PER_DAY), // due tomorrow
        lastSeenAt: NOW.toISOString(), // just seen
        errorsLast10: 0,
      }),
      NOW,
    );
    // due=0, error=0, recency≈0, type=0.10
    // score = 0.10*0.10 = 0.01
    expect(recent.score).toBeCloseTo(0.01, 2);
  });

  it('new items get lower typeBoost (0.05)', () => {
    const newItem = computeItemScore(
      makeItem({ isNew: true }),
      NOW,
    );
    expect(newItem.components.typeBoost).toBe(0.05);
  });

  it('ranks overdue conjugation above overdue vocabulary when errors are equal', () => {
    const base = {
      dueAt: isoOffset(-3 * MS_PER_DAY),
      lastSeenAt: isoOffset(-1_200_000),
      errorsLast10: 4,
      isNew: false,
    };
    const vocab = computeItemScore(makeItem({ ...base, entityType: 'vocabulary' }), NOW);
    const conj = computeItemScore(makeItem({ ...base, entityType: 'conjugation' }), NOW);
    expect(conj.score).toBeGreaterThan(vocab.score);
  });

  it('preserves original item fields in the result', () => {
    const item = makeItem({ entityId: 'abc-123', entityType: 'dialog' });
    const result = computeItemScore(item, NOW);
    expect(result.entityId).toBe('abc-123');
    expect(result.entityType).toBe('dialog');
  });
});
