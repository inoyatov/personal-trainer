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

export function registerAllHandlers(db: AppDatabase) {
  const courseRepo = createCourseRepository(db);
  const contentRepo = createContentRepository(db);
  const sessionRepo = createSessionRepository(db);
  const reviewRepo = createReviewRepository(db);
  const writingRepo = createWritingRepository(db);
  const reviewScheduler = createReviewScheduler(reviewRepo);
  const dashboardService = createDashboardService(db, reviewRepo);

  registerContentHandlers(courseRepo, contentRepo);
  registerSessionHandlers(sessionRepo, reviewScheduler);
  registerReviewHandlers(reviewRepo, contentRepo);
  registerWritingHandlers(writingRepo);
  registerDashboardHandlers(dashboardService);
  registerImportExportHandlers(db);
}
