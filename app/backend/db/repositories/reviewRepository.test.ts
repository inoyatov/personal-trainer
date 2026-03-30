import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../testDb';
import { createReviewRepository } from './reviewRepository';
import type { ReviewRepository } from './reviewRepository';

describe('reviewRepository', () => {
  let repo: ReviewRepository;

  beforeEach(() => {
    const db = createTestDb();
    repo = createReviewRepository(db);
  });

  it('should insert and retrieve a review state', () => {
    const state = repo.insertReviewState({
      id: 'rs1',
      userId: 'default',
      entityType: 'vocabulary',
      entityId: 'v1',
      currentStage: 'new',
      dueAt: new Date().toISOString(),
    });

    expect(state.currentStage).toBe('new');
    expect(state.easeScore).toBe(2.5);

    const fetched = repo.getReviewState('default', 'vocabulary', 'v1');
    expect(fetched).toBeDefined();
    expect(fetched!.id).toBe('rs1');
  });

  it('should get due items', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow

    repo.insertReviewState({
      id: 'rs1',
      userId: 'default',
      entityType: 'vocabulary',
      entityId: 'v1',
      currentStage: 'seen',
      dueAt: pastDate,
    });
    repo.insertReviewState({
      id: 'rs2',
      userId: 'default',
      entityType: 'vocabulary',
      entityId: 'v2',
      currentStage: 'new',
      dueAt: futureDate,
    });

    const dueItems = repo.getDueItems('default');
    expect(dueItems).toHaveLength(1);
    expect(dueItems[0].entityId).toBe('v1');
  });

  it('should update a review state', () => {
    repo.insertReviewState({
      id: 'rs1',
      userId: 'default',
      entityType: 'vocabulary',
      entityId: 'v1',
      currentStage: 'new',
      dueAt: new Date().toISOString(),
    });

    const updated = repo.updateReviewState('rs1', {
      currentStage: 'recognized',
      successCount: 3,
      easeScore: 2.8,
    });

    expect(updated!.currentStage).toBe('recognized');
    expect(updated!.successCount).toBe(3);
  });

  it('should upsert review state', () => {
    // Insert
    repo.upsertReviewState({
      id: 'rs1',
      userId: 'default',
      entityType: 'vocabulary',
      entityId: 'v1',
      currentStage: 'new',
      dueAt: new Date().toISOString(),
    });

    // Update via upsert
    const updated = repo.upsertReviewState({
      id: 'rs1',
      userId: 'default',
      entityType: 'vocabulary',
      entityId: 'v1',
      currentStage: 'recalled',
      dueAt: new Date().toISOString(),
    });

    expect(updated!.currentStage).toBe('recalled');

    // Should still only have one state
    const all = repo.getAllReviewStates('default');
    expect(all).toHaveLength(1);
  });

  it('getWeakItems should return items with low stage and failCount > 0', () => {
    repo.insertReviewState({
      id: 'w1',
      userId: 'default',
      entityType: 'sentence',
      entityId: 's1',
      currentStage: 'new',
      failCount: 2,
      dueAt: new Date().toISOString(),
    });
    repo.insertReviewState({
      id: 'w2',
      userId: 'default',
      entityType: 'sentence',
      entityId: 's2',
      currentStage: 'seen',
      failCount: 1,
      dueAt: new Date().toISOString(),
    });
    repo.insertReviewState({
      id: 'w3',
      userId: 'default',
      entityType: 'sentence',
      entityId: 's3',
      currentStage: 'recognized',
      failCount: 3,
      dueAt: new Date().toISOString(),
    });
    // recalled with failCount > 0 should NOT be returned
    repo.insertReviewState({
      id: 'w4',
      userId: 'default',
      entityType: 'sentence',
      entityId: 's4',
      currentStage: 'recalled',
      failCount: 1,
      dueAt: new Date().toISOString(),
    });

    const weak = repo.getWeakItems('default');
    expect(weak).toHaveLength(3);
    const ids = weak.map((w) => w.id);
    expect(ids).toContain('w1');
    expect(ids).toContain('w2');
    expect(ids).toContain('w3');
    expect(ids).not.toContain('w4');
  });

  it('getRecentErrorItems should return items ordered by lastSeenAt DESC', () => {
    repo.insertReviewState({
      id: 're1',
      userId: 'default',
      entityType: 'sentence',
      entityId: 'e1',
      currentStage: 'seen',
      failCount: 1,
      lastSeenAt: '2026-01-01T00:00:00.000Z',
      dueAt: new Date().toISOString(),
    });
    repo.insertReviewState({
      id: 're2',
      userId: 'default',
      entityType: 'sentence',
      entityId: 'e2',
      currentStage: 'recognized',
      failCount: 2,
      lastSeenAt: '2026-03-01T00:00:00.000Z',
      dueAt: new Date().toISOString(),
    });
    repo.insertReviewState({
      id: 're3',
      userId: 'default',
      entityType: 'sentence',
      entityId: 'e3',
      currentStage: 'new',
      failCount: 3,
      lastSeenAt: '2026-02-01T00:00:00.000Z',
      dueAt: new Date().toISOString(),
    });

    const items = repo.getRecentErrorItems('default', 10);
    expect(items).toHaveLength(3);
    expect(items[0].id).toBe('re2'); // most recent
    expect(items[1].id).toBe('re3');
    expect(items[2].id).toBe('re1'); // oldest

    // Test limit
    const limited = repo.getRecentErrorItems('default', 2);
    expect(limited).toHaveLength(2);
    expect(limited[0].id).toBe('re2');
    expect(limited[1].id).toBe('re3');
  });

  it('getLowestMasteryItems should order by stage ASC then failCount DESC', () => {
    repo.insertReviewState({
      id: 'lm1',
      userId: 'default',
      entityType: 'sentence',
      entityId: 'lm-s1',
      currentStage: 'new',
      failCount: 3,
      dueAt: new Date().toISOString(),
    });
    repo.insertReviewState({
      id: 'lm2',
      userId: 'default',
      entityType: 'sentence',
      entityId: 'lm-s2',
      currentStage: 'seen',
      failCount: 1,
      dueAt: new Date().toISOString(),
    });
    repo.insertReviewState({
      id: 'lm3',
      userId: 'default',
      entityType: 'sentence',
      entityId: 'lm-s3',
      currentStage: 'automated',
      failCount: 0,
      dueAt: new Date().toISOString(),
    });

    const items = repo.getLowestMasteryItems('default', 10);
    expect(items).toHaveLength(3);
    expect(items[0].id).toBe('lm1'); // new (stage 0), failCount 3
    expect(items[1].id).toBe('lm2'); // seen (stage 1), failCount 1
    expect(items[2].id).toBe('lm3'); // automated (stage 5), failCount 0

    // Test limit
    const limited = repo.getLowestMasteryItems('default', 2);
    expect(limited).toHaveLength(2);
    expect(limited[0].id).toBe('lm1');
    expect(limited[1].id).toBe('lm2');
  });
});
