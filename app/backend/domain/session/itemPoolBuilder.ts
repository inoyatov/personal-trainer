/**
 * Item Pool Builder — selects and balances items for a study session.
 * PRD v4.3 §4.5: gathers candidates, scores them, selects top-N,
 * then applies soft type balancing.
 */

import {
  computeItemScore,
  type ScorableItem,
  type ScoredItem,
  type ItemEntityType,
} from '../scheduler/scoringEngine';

export type { ItemEntityType };

export interface TypeDistribution {
  vocabulary: number;
  conjugation: number;
  sentence: number;
  dialog: number;
}

export interface PoolConfig {
  userId: string;
  courseId?: string;
  lessonId?: string;
  maxItems: number;
  targetDistribution: TypeDistribution;
  now?: Date;
}

/** Minimal review-state shape needed by the pool builder */
export interface ReviewStateCandidate {
  entityId: string;
  entityType: string;
  currentStage: string;
  dueAt: string;
  lastSeenAt: string | null;
  failCount: number;
}

/** Dependencies injected into buildItemPool */
export interface PoolBuilderDeps {
  reviewRepo: {
    getDueItems(userId: string, dueBeforeIso?: string): ReviewStateCandidate[];
    getWeakItems(userId: string): ReviewStateCandidate[];
    getRecentErrorItems(userId: string, limit: number): ReviewStateCandidate[];
    getLowestMasteryItems(userId: string, limit: number): ReviewStateCandidate[];
  };
  sessionRepo: {
    getRecentAnswersForEntities(
      entityIds: string[],
      limit: number,
    ): Record<string, { isCorrect: boolean; createdAt: string }[]>;
  };
  getNewItemsForLesson?: (lessonId: string, userId: string) => ReviewStateCandidate[];
}

const ENTITY_TYPE_SET = new Set<string>([
  'vocabulary',
  'conjugation',
  'sentence',
  'dialog',
]);

function isValidEntityType(t: string): t is ItemEntityType {
  return ENTITY_TYPE_SET.has(t);
}

/**
 * Score a batch of ReviewStateCandidates, filtering out already-selected entityIds
 * and invalid entity types.
 */
function scoreCandidates(
  candidates: ReviewStateCandidate[],
  selectedIds: Set<string>,
  deps: PoolBuilderDeps,
  now: Date,
  isNewOverride?: boolean,
): ScoredItem[] {
  const filtered = candidates.filter(
    (c) => !selectedIds.has(c.entityId) && isValidEntityType(c.entityType),
  );
  if (filtered.length === 0) return [];

  const entityIds = filtered.map((c) => c.entityId);
  const recentAnswers = deps.sessionRepo.getRecentAnswersForEntities(
    entityIds,
    10,
  );

  return filtered.map((c) => {
    const answers = recentAnswers[c.entityId] ?? [];
    const errorsLast10 = answers.filter((a) => !a.isCorrect).length;

    const scorable: ScorableItem = {
      entityId: c.entityId,
      entityType: c.entityType as ItemEntityType,
      isNew: isNewOverride ?? c.currentStage === 'new',
      dueAt: c.dueAt,
      lastSeenAt: c.lastSeenAt,
      errorsLast10,
    };

    return computeItemScore(scorable, now);
  });
}

/**
 * Build the item pool for a study session.
 */
export function buildItemPool(
  config: PoolConfig,
  deps: PoolBuilderDeps,
): ScoredItem[] {
  const now = config.now ?? new Date();

  // 1. Get due items
  const dueItems = deps.reviewRepo.getDueItems(
    config.userId,
    now.toISOString(),
  );

  // 2. Get weak items
  const weakItems = deps.reviewRepo.getWeakItems(config.userId);

  // 3. Combine and deduplicate by entityId
  const candidateMap = new Map<string, ReviewStateCandidate>();
  for (const item of dueItems) {
    candidateMap.set(item.entityId, item);
  }
  for (const item of weakItems) {
    if (!candidateMap.has(item.entityId)) {
      candidateMap.set(item.entityId, item);
    }
  }

  const candidates = Array.from(candidateMap.values()).filter((c) =>
    isValidEntityType(c.entityType),
  );

  if (candidates.length === 0 && !config.lessonId) {
    // Still attempt fallbacks below if we have no primary candidates
    // but only if there's no lessonId either — otherwise fall through
  }

  // 4. Get recent answers for error rate computation
  const entityIds = candidates.map((c) => c.entityId);
  const recentAnswers =
    entityIds.length > 0
      ? deps.sessionRepo.getRecentAnswersForEntities(entityIds, 10)
      : {};

  // 5. Score each candidate
  const scored: ScoredItem[] = candidates.map((c) => {
    const answers = recentAnswers[c.entityId] ?? [];
    const errorsLast10 = answers.filter((a) => !a.isCorrect).length;

    const scorable: ScorableItem = {
      entityId: c.entityId,
      entityType: c.entityType as ItemEntityType,
      isNew: c.currentStage === 'new',
      dueAt: c.dueAt,
      lastSeenAt: c.lastSeenAt,
      errorsLast10,
    };

    return computeItemScore(scorable, now);
  });

  // 6. Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // 7. Take top maxItems
  let selected = scored.slice(0, config.maxItems);
  const overflow = scored.slice(config.maxItems);

  // 8. Fallback chain — fill gaps when selected < maxItems
  if (selected.length < config.maxItems) {
    const selectedIds = new Set(selected.map((s) => s.entityId));

    // Fallback 1: Recent errors
    const remaining1 = config.maxItems - selected.length;
    const errorCandidates = deps.reviewRepo.getRecentErrorItems(
      config.userId,
      remaining1,
    );
    const errorScored = scoreCandidates(
      errorCandidates,
      selectedIds,
      deps,
      now,
    );
    errorScored.sort((a, b) => b.score - a.score);
    for (const item of errorScored) {
      if (selected.length >= config.maxItems) break;
      if (!selectedIds.has(item.entityId)) {
        selected.push(item);
        selectedIds.add(item.entityId);
      }
    }

    // Fallback 2: New items from frontier lesson
    if (
      selected.length < config.maxItems &&
      config.lessonId &&
      deps.getNewItemsForLesson
    ) {
      const newCandidates = deps.getNewItemsForLesson(
        config.lessonId,
        config.userId,
      );
      const newScored = scoreCandidates(
        newCandidates,
        selectedIds,
        deps,
        now,
        true,
      );
      newScored.sort((a, b) => b.score - a.score);
      for (const item of newScored) {
        if (selected.length >= config.maxItems) break;
        if (!selectedIds.has(item.entityId)) {
          selected.push(item);
          selectedIds.add(item.entityId);
        }
      }
    }

    // Fallback 3: Recycle lowest mastery
    if (selected.length < config.maxItems) {
      const remaining3 = config.maxItems - selected.length;
      const masteryCandidates = deps.reviewRepo.getLowestMasteryItems(
        config.userId,
        remaining3,
      );
      const masteryScored = scoreCandidates(
        masteryCandidates,
        selectedIds,
        deps,
        now,
      );
      masteryScored.sort((a, b) => b.score - a.score);
      for (const item of masteryScored) {
        if (selected.length >= config.maxItems) break;
        if (!selectedIds.has(item.entityId)) {
          selected.push(item);
          selectedIds.add(item.entityId);
        }
      }
    }
  }

  // 9. Apply soft type balancing on the final selection
  return applySoftTypeBalancing(
    selected,
    overflow,
    config.targetDistribution,
  );
}

/**
 * Soft type balancing: swap lowest-scored items from overrepresented types
 * with highest-scored items from underrepresented types in the overflow pool.
 * Only triggers when deviation exceeds +-20%.
 */
export function applySoftTypeBalancing(
  selected: ScoredItem[],
  overflow: ScoredItem[],
  targetDistribution: TypeDistribution,
): ScoredItem[] {
  if (selected.length === 0) return [];

  const result = [...selected];
  const overflowPool = [...overflow];

  // Compute actual distribution
  const typeCounts: Record<ItemEntityType, number> = {
    vocabulary: 0,
    conjugation: 0,
    sentence: 0,
    dialog: 0,
  };
  for (const item of result) {
    typeCounts[item.entityType]++;
  }

  const total = result.length;
  const types: ItemEntityType[] = [
    'vocabulary',
    'conjugation',
    'sentence',
    'dialog',
  ];

  // Identify overrepresented and underrepresented types
  const DEVIATION_THRESHOLD = 0.20;

  for (const underType of types) {
    const targetPct = targetDistribution[underType];
    const actualPct = typeCounts[underType] / total;
    const underDeviation = targetPct - actualPct;

    if (underDeviation <= DEVIATION_THRESHOLD) continue;

    // This type is underrepresented — find an overrepresented type to swap from
    for (const overType of types) {
      if (overType === underType) continue;

      const overTargetPct = targetDistribution[overType];
      const overActualPct = typeCounts[overType] / total;
      const overDeviation = overActualPct - overTargetPct;

      if (overDeviation <= DEVIATION_THRESHOLD) continue;

      // Find highest-scored item of underType in overflow
      const overflowIdx = overflowPool.findIndex(
        (item) => item.entityType === underType,
      );
      if (overflowIdx === -1) continue;

      // Find lowest-scored item of overType in result
      let worstIdx = -1;
      let worstScore = Infinity;
      for (let i = 0; i < result.length; i++) {
        if (
          result[i].entityType === overType &&
          result[i].score < worstScore
        ) {
          worstScore = result[i].score;
          worstIdx = i;
        }
      }
      if (worstIdx === -1) continue;

      // Perform swap
      const swappedOut = result[worstIdx];
      const swappedIn = overflowPool[overflowIdx];
      result[worstIdx] = swappedIn;
      overflowPool[overflowIdx] = swappedOut;

      // Update counts
      typeCounts[overType]--;
      typeCounts[underType]++;
    }
  }

  return result;
}
