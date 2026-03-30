/**
 * Deterministic scoring engine for the unified learning session builder.
 * PRD v4.3 §2-3: All scores normalized to [0, 1].
 *
 * Final score = 0.50 * dueScore
 *             + 0.25 * errorScore
 *             + 0.15 * recencyScore
 *             + 0.10 * typeBoost
 */

export type ItemEntityType = 'vocabulary' | 'conjugation' | 'sentence' | 'dialog';

export interface ScorableItem {
  entityId: string;
  entityType: ItemEntityType;
  isNew: boolean;
  /** ISO timestamp when the item is next due, or null if never scheduled */
  dueAt: string | null;
  /** ISO timestamp when the item was last seen, or null if never seen */
  lastSeenAt: string | null;
  /** Number of errors in the last 10 attempts (0-10) */
  errorsLast10: number;
}

export interface ScoredItem extends ScorableItem {
  score: number;
  components: {
    dueScore: number;
    errorScore: number;
    recencyScore: number;
    typeBoost: number;
  };
}

const WEIGHTS = {
  due: 0.50,
  error: 0.25,
  recency: 0.15,
  type: 0.10,
} as const;

const TYPE_BOOST_MAP: Record<ItemEntityType, number> = {
  vocabulary: 0.10,
  conjugation: 0.15,
  sentence: 0.08,
  dialog: 0.08,
};

const NEW_CONTENT_BOOST = 0.05;

const MS_PER_DAY = 86_400_000;
const DUE_SCORE_MAX_DAYS = 7;
const RECENCY_DECAY_SECONDS = 600;

/**
 * How overdue an item is, normalized to [0, 1].
 * 0 = not yet due, 1 = 7+ days overdue.
 */
export function dueScore(dueAt: string | null, now: Date): number {
  if (dueAt === null) return 0;
  const daysOverdue = Math.max(0, (now.getTime() - new Date(dueAt).getTime()) / MS_PER_DAY);
  return Math.min(1, daysOverdue / DUE_SCORE_MAX_DAYS);
}

/**
 * Error rate over last 10 attempts, normalized to [0, 1].
 */
export function errorScore(errorsLast10: number): number {
  return Math.min(1, Math.max(0, errorsLast10 / 10));
}

/**
 * Recency penalty: recently-seen items score low, older items score high.
 * PRD v4.3.1 §2: recencyScore = 1 - exp(-secondsSinceSeen / 600)
 * Range: [0, 1]. Recent → ~0, older → ~1.
 */
export function recencyScore(lastSeenAt: string | null, now: Date): number {
  if (lastSeenAt === null) return 1;
  const secondsSinceSeen = Math.max(0, (now.getTime() - new Date(lastSeenAt).getTime()) / 1000);
  return 1 - Math.exp(-secondsSinceSeen / RECENCY_DECAY_SECONDS);
}

/**
 * Static boost per content type.
 * New items get the lower NEW_CONTENT_BOOST instead of their type boost.
 */
export function typeBoost(entityType: ItemEntityType, isNew: boolean): number {
  if (isNew) return NEW_CONTENT_BOOST;
  return TYPE_BOOST_MAP[entityType];
}

/**
 * Compute the final priority score for a single item.
 */
export function computeItemScore(item: ScorableItem, now: Date = new Date()): ScoredItem {
  const ds = dueScore(item.dueAt, now);
  const es = errorScore(item.errorsLast10);
  const rs = recencyScore(item.lastSeenAt, now);
  const tb = typeBoost(item.entityType, item.isNew);

  const score =
    WEIGHTS.due * ds +
    WEIGHTS.error * es +
    WEIGHTS.recency * rs +
    WEIGHTS.type * tb;

  return {
    ...item,
    score,
    components: {
      dueScore: ds,
      errorScore: es,
      recencyScore: rs,
      typeBoost: tb,
    },
  };
}
