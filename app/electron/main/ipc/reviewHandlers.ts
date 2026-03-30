import { ipcMain } from 'electron';
import { Channels } from '../../../shared/contracts/channels';
import {
  getDueItemsRequest,
  getReviewStateRequest,
  updateReviewStateRequest,
  getAllReviewStatesRequest,
} from '../../../shared/contracts/schemas';
import type { ReviewRepository } from '../../../backend/db/repositories/reviewRepository';

export function registerReviewHandlers(reviewRepo: ReviewRepository) {
  ipcMain.handle(Channels.REVIEW_GET_DUE_ITEMS, (_event, data: unknown) => {
    const { userId } = getDueItemsRequest.parse(data ?? {});
    return reviewRepo.getDueItems(userId);
  });

  ipcMain.handle(Channels.REVIEW_GET_STATE, (_event, data: unknown) => {
    const { userId, entityType, entityId } =
      getReviewStateRequest.parse(data);
    return reviewRepo.getReviewState(userId, entityType, entityId);
  });

  ipcMain.handle(Channels.REVIEW_UPDATE_STATE, (_event, data: unknown) => {
    const parsed = updateReviewStateRequest.parse(data);
    return reviewRepo.upsertReviewState(parsed);
  });

  ipcMain.handle(
    Channels.REVIEW_GET_ALL_STATES,
    (_event, data: unknown) => {
      const { userId } = getAllReviewStatesRequest.parse(data ?? {});
      return reviewRepo.getAllReviewStates(userId);
    },
  );
}
