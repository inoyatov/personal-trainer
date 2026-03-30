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
});
