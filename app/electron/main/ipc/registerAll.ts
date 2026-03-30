import type { AppDatabase } from '../../../backend/db/index';
import { createCourseRepository } from '../../../backend/db/repositories/courseRepository';
import { createContentRepository } from '../../../backend/db/repositories/contentRepository';
import { createSessionRepository } from '../../../backend/db/repositories/sessionRepository';
import { createReviewRepository } from '../../../backend/db/repositories/reviewRepository';
import { createWritingRepository } from '../../../backend/db/repositories/writingRepository';
import { createReviewScheduler } from '../../../backend/domain/scheduler/reviewScheduler';
import { createDashboardService } from '../../../backend/domain/progress/dashboardService';
import { registerContentHandlers } from './contentHandlers';
import { registerSessionHandlers } from './sessionHandlers';
import { registerReviewHandlers } from './reviewHandlers';
import { registerWritingHandlers } from './writingHandlers';
import { registerDashboardHandlers } from './dashboardHandlers';
import { registerImportExportHandlers } from './importExportHandlers';
import { createVerbRepository } from '../../../backend/db/repositories/verbRepository';
import { registerConjugationHandlers } from './conjugationHandlers';
import { registerProgressHandlers } from './progressHandlers';
import { createUnifiedSessionBuilder } from '../../../backend/domain/session/unifiedSessionBuilder';

export function registerAllHandlers(db: AppDatabase) {
  const courseRepo = createCourseRepository(db);
  const contentRepo = createContentRepository(db);
  const sessionRepo = createSessionRepository(db);
  const reviewRepo = createReviewRepository(db);
  const writingRepo = createWritingRepository(db);
  const verbRepo = createVerbRepository(db);
  const reviewScheduler = createReviewScheduler(reviewRepo);
  const dashboardService = createDashboardService(db, reviewRepo);

  const unifiedBuilder = createUnifiedSessionBuilder({
    courseRepo,
    contentRepo,
    reviewRepo,
    sessionRepo,
    verbRepo,
  });

  // Clean up orphaned review states on startup
  cleanupOrphanedReviewStates(reviewRepo, contentRepo);

  registerContentHandlers(courseRepo, contentRepo);
  registerSessionHandlers(sessionRepo, reviewScheduler, unifiedBuilder);
  registerReviewHandlers(reviewRepo, contentRepo);
  registerWritingHandlers(writingRepo);
  registerDashboardHandlers(dashboardService);
  registerImportExportHandlers(db);
  registerConjugationHandlers(verbRepo, contentRepo);
  registerProgressHandlers(courseRepo, contentRepo, reviewRepo);
}

/**
 * Delete review states whose entityId doesn't resolve to any content.
 * Runs once on app startup to clean up legacy/orphaned data.
 */
function cleanupOrphanedReviewStates(
  reviewRepo: ReturnType<typeof createReviewRepository>,
  contentRepo: ReturnType<typeof createContentRepository>,
) {
  const allStates = reviewRepo.getAllReviewStates('default');
  let deleted = 0;

  for (const state of allStates) {
    let exists = false;

    if (state.entityType === 'vocabulary') {
      exists = !!contentRepo.getVocabularyById(state.entityId);
    } else if (state.entityType === 'sentence') {
      exists = !!contentRepo.getSentenceById(state.entityId)
        || !!contentRepo.getDialogTurnById(state.entityId);
    } else if (state.entityType === 'dialog') {
      exists = !!contentRepo.getDialogById(state.entityId);
    }

    if (!exists) {
      reviewRepo.deleteReviewState(state.id);
      deleted++;
    }
  }

  if (deleted > 0) {
    console.log(`Cleaned up ${deleted} orphaned review state(s)`);
  }
}
