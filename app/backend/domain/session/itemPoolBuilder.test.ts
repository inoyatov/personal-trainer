import { describe, it, expect } from 'vitest';
import {
  buildItemPool,
  applySoftTypeBalancing,
  type PoolConfig,
  type PoolBuilderDeps,
  type ReviewStateCandidate,
  type TypeDistribution,
  type ItemEntityType,
} from './itemPoolBuilder';
import type { ScoredItem } from '../scheduler/scoringEngine';
import { computeItemScore } from '../scheduler/scoringEngine';

// ── helpers ──────────────────────────────────────────────────────────

function makeCandidate(
  overrides: Partial<ReviewStateCandidate> & { entityId: string },
): ReviewStateCandidate {
  return {
    entityType: 'vocabulary',
    currentStage: 'seen',
    dueAt: new Date(Date.now() - 86_400_000).toISOString(), // 1 day overdue
    lastSeenAt: new Date(Date.now() - 3_600_000).toISOString(), // 1 hr ago
    failCount: 1,
    ...overrides,
  };
}

function makeDeps(overrides?: {
  dueItems?: ReviewStateCandidate[];
  weakItems?: ReviewStateCandidate[];
  recentErrorItems?: ReviewStateCandidate[];
  lowestMasteryItems?: ReviewStateCandidate[];
  newLessonItems?: ReviewStateCandidate[];
  recentAnswers?: Record<
    string,
    { isCorrect: boolean; createdAt: string }[]
  >;
}): PoolBuilderDeps {
  return {
    reviewRepo: {
      getDueItems: () => overrides?.dueItems ?? [],
      getWeakItems: () => overrides?.weakItems ?? [],
      getRecentErrorItems: () => overrides?.recentErrorItems ?? [],
      getLowestMasteryItems: () => overrides?.lowestMasteryItems ?? [],
    },
    sessionRepo: {
      getRecentAnswersForEntities: () => overrides?.recentAnswers ?? {},
    },
    ...(overrides?.newLessonItems
      ? { getNewItemsForLesson: () => overrides.newLessonItems! }
      : {}),
  };
}

const balancedDistribution: TypeDistribution = {
  vocabulary: 0.25,
  conjugation: 0.25,
  sentence: 0.25,
  dialog: 0.25,
};

const now = new Date('2026-03-30T12:00:00Z');

// ── buildItemPool tests ─────────────────────────────────────────────

describe('buildItemPool', () => {
  it('returns empty array when there are no candidates', () => {
    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 10,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(config, makeDeps());
    expect(result).toEqual([]);
  });

  it('scores and ranks items descending by score', () => {
    const items = [
      makeCandidate({
        entityId: 'a',
        dueAt: new Date(now.getTime() - 6 * 86_400_000).toISOString(), // 6 days overdue
      }),
      makeCandidate({
        entityId: 'b',
        dueAt: new Date(now.getTime() - 1 * 86_400_000).toISOString(), // 1 day overdue
      }),
      makeCandidate({
        entityId: 'c',
        dueAt: new Date(now.getTime() + 86_400_000).toISOString(), // not yet due (due tomorrow)
      }),
    ];

    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 10,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(config, makeDeps({ dueItems: items }));

    expect(result.length).toBe(3);
    // Scores should be in descending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
    // Most overdue item should be first
    expect(result[0].entityId).toBe('a');
  });

  it('respects maxItems limit', () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      makeCandidate({
        entityId: `item-${i}`,
        dueAt: new Date(now.getTime() - i * 86_400_000).toISOString(),
      }),
    );

    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 5,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(config, makeDeps({ dueItems: items }));
    expect(result.length).toBe(5);
  });

  it('deduplicates items that appear in both due and weak lists', () => {
    const shared = makeCandidate({ entityId: 'shared-1' });
    const dueOnly = makeCandidate({ entityId: 'due-only' });
    const weakOnly = makeCandidate({ entityId: 'weak-only' });

    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 10,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(
      config,
      makeDeps({
        dueItems: [shared, dueOnly],
        weakItems: [{ ...shared }, weakOnly],
      }),
    );

    const entityIds = result.map((r) => r.entityId);
    expect(entityIds).toHaveLength(3);
    expect(new Set(entityIds).size).toBe(3);
    expect(entityIds).toContain('shared-1');
    expect(entityIds).toContain('due-only');
    expect(entityIds).toContain('weak-only');
  });

  it('uses weak items as fallback when no due items exist', () => {
    const weakItems = [
      makeCandidate({ entityId: 'w1', failCount: 3 }),
      makeCandidate({ entityId: 'w2', failCount: 1 }),
    ];

    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 10,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(
      config,
      makeDeps({ dueItems: [], weakItems }),
    );
    expect(result.length).toBe(2);
  });

  it('computes errorsLast10 from recent answers', () => {
    const items = [makeCandidate({ entityId: 'e1' })];
    const recentAnswers = {
      e1: [
        { isCorrect: false, createdAt: now.toISOString() },
        { isCorrect: false, createdAt: now.toISOString() },
        { isCorrect: true, createdAt: now.toISOString() },
        { isCorrect: false, createdAt: now.toISOString() },
      ],
    };

    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 10,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(
      config,
      makeDeps({ dueItems: items, recentAnswers }),
    );

    // 3 errors out of 4 answers → errorsLast10 = 3
    expect(result[0].components.errorScore).toBeCloseTo(3 / 10, 5);
  });

  it('filters out items with unknown entity types', () => {
    const items = [
      makeCandidate({ entityId: 'valid', entityType: 'vocabulary' }),
      makeCandidate({ entityId: 'invalid', entityType: 'unknown_type' }),
    ];

    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 10,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(config, makeDeps({ dueItems: items }));
    expect(result.length).toBe(1);
    expect(result[0].entityId).toBe('valid');
  });
});

// ── fallback chain tests ────────────────────────────────────────────

describe('buildItemPool fallback chain', () => {
  it('fills gap with recent error items when due+weak < maxItems', () => {
    const dueItems = [
      makeCandidate({ entityId: 'due1' }),
      makeCandidate({ entityId: 'due2' }),
    ];
    const recentErrorItems = [
      makeCandidate({ entityId: 'err1', failCount: 3 }),
      makeCandidate({ entityId: 'err2', failCount: 2 }),
    ];

    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 4,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(
      config,
      makeDeps({ dueItems, recentErrorItems }),
    );

    expect(result.length).toBe(4);
    const ids = result.map((r) => r.entityId);
    expect(ids).toContain('due1');
    expect(ids).toContain('due2');
    expect(ids).toContain('err1');
    expect(ids).toContain('err2');
  });

  it('fills remaining with lowest mastery items after all other sources', () => {
    const dueItems = [makeCandidate({ entityId: 'due1' })];
    const recentErrorItems = [makeCandidate({ entityId: 'err1', failCount: 2 })];
    const lowestMasteryItems = [
      makeCandidate({ entityId: 'low1', currentStage: 'new', failCount: 0 }),
      makeCandidate({ entityId: 'low2', currentStage: 'seen', failCount: 0 }),
    ];

    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 4,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(
      config,
      makeDeps({ dueItems, recentErrorItems, lowestMasteryItems }),
    );

    expect(result.length).toBe(4);
    const ids = result.map((r) => r.entityId);
    expect(ids).toContain('due1');
    expect(ids).toContain('err1');
    expect(ids).toContain('low1');
    expect(ids).toContain('low2');
  });

  it('deduplicates across fallback sources', () => {
    // The same item appears in due, error, and mastery lists
    const shared = makeCandidate({ entityId: 'shared', failCount: 2 });
    const dueItems = [shared];
    const recentErrorItems = [{ ...shared }];
    const lowestMasteryItems = [{ ...shared }];

    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 5,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(
      config,
      makeDeps({ dueItems, recentErrorItems, lowestMasteryItems }),
    );

    // Should only appear once
    const sharedCount = result.filter((r) => r.entityId === 'shared').length;
    expect(sharedCount).toBe(1);
  });

  it('includes new lesson items when lessonId is provided', () => {
    const dueItems = [makeCandidate({ entityId: 'due1' })];
    const newLessonItems = [
      makeCandidate({ entityId: 'new1', currentStage: 'new' }),
      makeCandidate({ entityId: 'new2', currentStage: 'new' }),
    ];

    const config: PoolConfig = {
      userId: 'u1',
      lessonId: 'lesson-1',
      maxItems: 3,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(
      config,
      makeDeps({ dueItems, newLessonItems }),
    );

    expect(result.length).toBe(3);
    const ids = result.map((r) => r.entityId);
    expect(ids).toContain('new1');
    expect(ids).toContain('new2');
  });

  it('fallback items are scored and sorted correctly', () => {
    // No due/weak items; all come from recent errors
    const recentErrorItems = [
      makeCandidate({
        entityId: 'err-old',
        failCount: 3,
        dueAt: new Date(now.getTime() - 6 * 86_400_000).toISOString(), // 6 days overdue
      }),
      makeCandidate({
        entityId: 'err-recent',
        failCount: 1,
        dueAt: new Date(now.getTime() - 1 * 86_400_000).toISOString(), // 1 day overdue
      }),
    ];

    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 5,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(
      config,
      makeDeps({ recentErrorItems }),
    );

    expect(result.length).toBe(2);
    // More overdue item should score higher
    expect(result[0].entityId).toBe('err-old');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('does not exceed maxItems even when fallback sources have many items', () => {
    const recentErrorItems = Array.from({ length: 10 }, (_, i) =>
      makeCandidate({ entityId: `err-${i}`, failCount: 2 }),
    );
    const lowestMasteryItems = Array.from({ length: 10 }, (_, i) =>
      makeCandidate({ entityId: `low-${i}` }),
    );

    const config: PoolConfig = {
      userId: 'u1',
      maxItems: 5,
      targetDistribution: balancedDistribution,
      now,
    };
    const result = buildItemPool(
      config,
      makeDeps({ recentErrorItems, lowestMasteryItems }),
    );

    expect(result.length).toBe(5);
  });

  it('skips new lesson items fallback when getNewItemsForLesson is not provided', () => {
    const dueItems = [makeCandidate({ entityId: 'due1' })];

    const config: PoolConfig = {
      userId: 'u1',
      lessonId: 'lesson-1',
      maxItems: 5,
      targetDistribution: balancedDistribution,
      now,
    };
    // No getNewItemsForLesson provided in deps
    const result = buildItemPool(config, makeDeps({ dueItems }));

    // Should still work, just with fewer items
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].entityId).toBe('due1');
  });
});

// ── applySoftTypeBalancing tests ────────────────────────────────────

describe('applySoftTypeBalancing', () => {
  function makeScoredItem(
    entityId: string,
    entityType: ItemEntityType,
    score: number,
  ): ScoredItem {
    return {
      entityId,
      entityType,
      isNew: false,
      dueAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
      errorsLast10: 0,
      score,
      components: {
        dueScore: 0,
        errorScore: 0,
        recencyScore: 0,
        typeBoost: 0,
      },
    };
  }

  it('returns empty array for empty input', () => {
    const result = applySoftTypeBalancing([], [], balancedDistribution);
    expect(result).toEqual([]);
  });

  it('does not swap when types are within +-20% of target', () => {
    // 3 vocab, 3 conj, 2 sentence, 2 dialog → 30%, 30%, 20%, 20%
    // target is 25% each, max deviation is 5% → no swaps
    const selected: ScoredItem[] = [
      makeScoredItem('v1', 'vocabulary', 0.9),
      makeScoredItem('v2', 'vocabulary', 0.85),
      makeScoredItem('v3', 'vocabulary', 0.8),
      makeScoredItem('c1', 'conjugation', 0.75),
      makeScoredItem('c2', 'conjugation', 0.7),
      makeScoredItem('c3', 'conjugation', 0.65),
      makeScoredItem('s1', 'sentence', 0.6),
      makeScoredItem('s2', 'sentence', 0.55),
      makeScoredItem('d1', 'dialog', 0.5),
      makeScoredItem('d2', 'dialog', 0.45),
    ];
    const overflow: ScoredItem[] = [
      makeScoredItem('s3', 'sentence', 0.4),
      makeScoredItem('d3', 'dialog', 0.35),
    ];

    const result = applySoftTypeBalancing(
      selected,
      overflow,
      balancedDistribution,
    );

    // No changes expected
    const ids = result.map((r) => r.entityId).sort();
    const originalIds = selected.map((s) => s.entityId).sort();
    expect(ids).toEqual(originalIds);
  });

  it('swaps items when a type is overrepresented by >20%', () => {
    // 8 vocab, 0 conj, 1 sentence, 1 dialog = 10 items
    // vocab is 80%, target 25% → overrepresented by 55%
    // conj is 0%, target 25% → underrepresented by 25%
    const selected: ScoredItem[] = [
      makeScoredItem('v1', 'vocabulary', 0.9),
      makeScoredItem('v2', 'vocabulary', 0.85),
      makeScoredItem('v3', 'vocabulary', 0.8),
      makeScoredItem('v4', 'vocabulary', 0.75),
      makeScoredItem('v5', 'vocabulary', 0.7),
      makeScoredItem('v6', 'vocabulary', 0.65),
      makeScoredItem('v7', 'vocabulary', 0.6),
      makeScoredItem('v8', 'vocabulary', 0.55),
      makeScoredItem('s1', 'sentence', 0.5),
      makeScoredItem('d1', 'dialog', 0.45),
    ];
    const overflow: ScoredItem[] = [
      makeScoredItem('c1', 'conjugation', 0.4),
      makeScoredItem('c2', 'conjugation', 0.35),
    ];

    const result = applySoftTypeBalancing(
      selected,
      overflow,
      balancedDistribution,
    );

    // At least one conjugation item should have been swapped in
    const conjCount = result.filter(
      (r) => r.entityType === 'conjugation',
    ).length;
    expect(conjCount).toBeGreaterThanOrEqual(1);

    // vocab count should have decreased
    const vocabCount = result.filter(
      (r) => r.entityType === 'vocabulary',
    ).length;
    expect(vocabCount).toBeLessThan(8);

    // Total items unchanged
    expect(result.length).toBe(10);
  });

  it('does not swap if overflow has no items of the underrepresented type', () => {
    // All vocabulary, no overflow items of other types
    const selected: ScoredItem[] = Array.from({ length: 10 }, (_, i) =>
      makeScoredItem(`v${i}`, 'vocabulary', 0.9 - i * 0.05),
    );
    const overflow: ScoredItem[] = [
      makeScoredItem('v10', 'vocabulary', 0.3),
    ];

    const result = applySoftTypeBalancing(
      selected,
      overflow,
      balancedDistribution,
    );

    // No swaps possible — all items remain vocabulary
    const vocabCount = result.filter(
      (r) => r.entityType === 'vocabulary',
    ).length;
    expect(vocabCount).toBe(10);
  });
});
