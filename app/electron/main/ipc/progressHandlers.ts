import { ipcMain } from 'electron';
import { Channels } from '../../../shared/contracts/channels';
import {
  getVocabCoverageRequest,
  getLessonUnlockStatusRequest,
} from '../../../shared/contracts/schemas';
import type { CourseRepository } from '../../../backend/db/repositories/courseRepository';
import type { ContentRepository } from '../../../backend/db/repositories/contentRepository';
import type { ReviewRepository } from '../../../backend/db/repositories/reviewRepository';
import { computeVocabCoverage, computeTotalVocabCoverage } from '../../../backend/domain/progress/vocabCoverageService';
import { createLessonFrontierService } from '../../../backend/domain/session/lessonFrontier';

export function registerProgressHandlers(
  courseRepo: CourseRepository,
  contentRepo: ContentRepository,
  reviewRepo: ReviewRepository,
) {
  ipcMain.handle(
    Channels.PROGRESS_GET_VOCAB_COVERAGE,
    (_event, data: unknown) => {
      const { courseId, userId } = getVocabCoverageRequest.parse(data);
      return computeVocabCoverage(courseId, userId, courseRepo, contentRepo, reviewRepo);
    },
  );

  ipcMain.handle(
    Channels.PROGRESS_GET_TOTAL_VOCAB_COVERAGE,
    (_event, data: unknown) => {
      const userId = (data as any)?.userId ?? 'default';
      return computeTotalVocabCoverage(userId, courseRepo, contentRepo, reviewRepo);
    },
  );

  const frontierService = createLessonFrontierService(courseRepo, contentRepo, reviewRepo);

  ipcMain.handle(
    Channels.PROGRESS_GET_LESSON_UNLOCK_STATUS,
    (_event, data: unknown) => {
      const { courseId, userId } = getLessonUnlockStatusRequest.parse(data);
      return frontierService.getLessonUnlockStatus(userId, courseId);
    },
  );
}
