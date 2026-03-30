import type { ReviewRepository } from '../../db/repositories/reviewRepository';
import type { SessionRepository } from '../../db/repositories/sessionRepository';
import type { AppDatabase } from '../../db/index';
import { sessions, sessionAnswers } from '../../db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

export interface DashboardStats {
  dueReviewCount: number;
  todaySessionCount: number;
  todayCorrect: number;
  todayTotal: number;
  todayAccuracy: number;
  totalItemsLearned: number;
  totalSessions: number;
}

export interface RecentSession {
  id: string;
  mode: string;
  startedAt: string;
  endedAt: string | null;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

export function createDashboardService(
  db: AppDatabase,
  reviewRepo: ReviewRepository,
) {
  return {
    getStats(userId = 'default'): DashboardStats {
      // Due items
      const dueItems = reviewRepo.getDueItems(userId);
      const dueReviewCount = dueItems.length;

      // Today's sessions
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      const todaySessions = db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            gte(sessions.startedAt, todayIso),
          ),
        )
        .all();

      const todaySessionCount = todaySessions.length;
      let todayCorrect = 0;
      let todayTotal = 0;
      for (const s of todaySessions) {
        todayCorrect += s.correctAnswers;
        todayTotal += s.totalQuestions;
      }
      const todayAccuracy =
        todayTotal > 0 ? Math.round((todayCorrect / todayTotal) * 100) : 0;

      // Total items learned (review states not in 'new' stage)
      const allStates = reviewRepo.getAllReviewStates(userId);
      const totalItemsLearned = allStates.filter(
        (s) => s.currentStage !== 'new',
      ).length;

      // Total sessions ever
      const allSessions = db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .all();

      return {
        dueReviewCount,
        todaySessionCount,
        todayCorrect,
        todayTotal,
        todayAccuracy,
        totalItemsLearned,
        totalSessions: allSessions.length,
      };
    },

    getRecentSessions(userId = 'default', limit = 5): RecentSession[] {
      const recent = db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.startedAt))
        .limit(limit)
        .all();

      return recent.map((s) => ({
        id: s.id,
        mode: s.mode,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        totalQuestions: s.totalQuestions,
        correctAnswers: s.correctAnswers,
        accuracy:
          s.totalQuestions > 0
            ? Math.round((s.correctAnswers / s.totalQuestions) * 100)
            : 0,
      }));
    },
  };
}

export type DashboardService = ReturnType<typeof createDashboardService>;
